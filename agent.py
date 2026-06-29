"""Access Revocation Process Flow — ADK 2.0 3-Agent Workflow.

Flow:
  1. Agent 1 (ticket_fetcher):        Fetch open tickets, filter by revocation keywords
  2. Agent 2 (access_revoker):        Look up user in NM, revoke non-Tangoe servers,
                                      submit request-only for Tangoe, update work notes
  3. Agent 3 (ticket_closer):         Generate closure summary and close the ticket
"""

from typing import Any

from google.adk import Agent, Event, Workflow
from google.adk.workflow import node
from pydantic import BaseModel

try:
    from . import api_call as api
except ImportError:
    import api_call as api


# ── Pydantic schemas for LLM agent outputs ──────────────────────────────────


class UserInfoOutput(BaseModel):
    user_email: str = ""
    user_name: str = ""


class RevocationSummaryOutput(BaseModel):
    summary: str


# ── Helper ───────────────────────────────────────────────────────────────────


def _str(val) -> str:
    return val if isinstance(val, str) else (str(val) if val is not None else "")


TANGOE_NAMES = {"tangoe", "tango"}


def _is_tangoe(server: str) -> bool:
    return server.strip().lower() in TANGOE_NAMES


def _build_action_log_entry(server: str, success: bool, is_tangoe: bool = False) -> str:
    if is_tangoe:
        if success:
            return f"Tangoe revocation request submitted for {server}. Awaiting vendor processing."
        return f"FAILED to submit Tangoe revocation request for {server}."
    else:
        if success:
            return f"Access revoked for {server}."
        return f"FAILED to revoke access for {server}."


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 1: Ticket Fetcher & Parser
# ═══════════════════════════════════════════════════════════════════════════════

ticket_fetcher = Agent(
    name="ticket_fetcher",
    model="gemini-2.5-flash-lite",
    output_schema=UserInfoOutput,
    instruction=(
        "You are given a ServiceNow ticket for an access revocation request. "
        "Extract the user_email and user_name from the ticket fields provided. "
        "Use the ticket's own email and name fields - do NOT guess or extract "
        "from the description. Return only the JSON object."
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 3: Ticket Closer
# ═══════════════════════════════════════════════════════════════════════════════

ticket_closer = Agent(
    name="ticket_closer",
    model="gemini-2.5-flash-lite",
    output_schema=RevocationSummaryOutput,
    instruction=(
        "Write a concise one-sentence closure summary for a ServiceNow ticket. "
        "State which servers had access revoked, note if a Tangoe revocation "
        "request was submitted (not directly revoked), and confirm the ticket "
        "is being closed. Use the action log provided. Return only the JSON object."
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 1: Fetch open revocation tickets from Ticket Resolver
# ═══════════════════════════════════════════════════════════════════════════════


def check_tickets():
    new_tickets = api.fetch_requests(state="open")
    combined = new_tickets if isinstance(new_tickets, list) else []
    revocation_keywords = ["revoke", "revocation", "offboarding", "off-board", "termination"]
    filtered = [
        t for t in combined
        if any(kw in _str(t.get("short_description", "")).lower() for kw in revocation_keywords)
    ]
    yield Event(state={"ticket_data": {"data": filtered, "count": len(filtered)}})


def check_tickets_router(ctx: Any):
    if ctx.state.get("ticket_data", {}).get("count", 0) <= 0:
        return Event(route="END")
    return Event(route="process_ticket")


def end():
    return "END"


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 2: Process ticket — look up user, check assigned servers
# ═══════════════════════════════════════════════════════════════════════════════


@node(rerun_on_resume=True)
async def process_ticket(ctx: Any) -> Event:
    tickets = ctx.state.get("ticket_data", {}).get("data", [])
    if not tickets:
        return Event(state={"route": "error", "error": "No tickets to process."})

    ticket = tickets[0]
    sys_id = _str(ticket.get("sys_id"))
    caller = _str(ticket.get("caller"))
    email = _str(ticket.get("email")).strip().lower()

    api.update_ticket(
        sys_id,
        work_notes="[Revocation] Process initiated. Reading ticket and identifying user.",
    )

    # Use ticket's own email and name — never rely on LLM extraction for these
    user_email = email
    user_name = caller.strip()

    # Look up user in Network Management by email
    users_result = api.get_users()
    if not isinstance(users_result, list):
        api.update_ticket(
            sys_id,
            work_notes="[Revocation] ERROR: Network Management API returned unexpected format.",
        )
        return Event(state={"route": "error", "error": "Invalid API response format."})

    matched_user = None
    for u in users_result:
        u_email = _str(u.get("email") or u.get("mail") or u.get("mailAddress") or "").strip().lower()
        if user_email and u_email == user_email:
            matched_user = u
            break
        u_name = _str(u.get("name") or u.get("fullname") or u.get("displayName") or "").strip().lower()
        if user_name and u_name == user_name.lower():
            matched_user = u
            break

    # Create user if not found
    if not matched_user:
        employee_id = _str(ticket.get("employeeId") or "")
        user_roles = ticket.get("roles") or []
        created = api.create_user(
            name=user_name or caller,
            employee_id=employee_id,
            email=user_email,
            location="USA",
            roles=user_roles,
            servers=None,
        )
        matched_user = created
        api.update_ticket(
            sys_id,
            work_notes=(
                f"[Revocation] User '{user_name or caller}' ({user_email}) "
                f"not found in NM. Created automatically with ID: {created.get('id', 'N/A')}."
            ),
        )

    user_id = matched_user.get("id", "")
    user_display_name = (
        f"{matched_user.get('firstname', '')} {matched_user.get('lastname', '')}".strip()
        or matched_user.get("name", user_name)
    )

    # Get user's actual assigned servers from NM
    assigned_servers = matched_user.get("servers", [])
    if not assigned_servers:
        api.update_ticket(
            sys_id,
            state="Closed",
            work_notes=f"[Revocation] User '{user_display_name}' has no servers assigned. Closing ticket.",
        )
        return Event(state={"route": "error", "error": "No servers assigned to user."})

    api.update_ticket(
        sys_id,
        work_notes=(
            f"[Revocation] User '{user_display_name}' has {len(assigned_servers)} "
            f"server(s) assigned: {', '.join(assigned_servers)}."
        ),
    )

    return Event(state={
        "route":            "revoke",
        "sys_id":           sys_id,
        "user_id":          user_id,
        "user_name":        user_display_name,
        "user_email":       user_email,
        "assigned_servers": assigned_servers,
    })


def process_ticket_router(ctx: Any, node_input: Any):
    route = ctx.state.get("route", "error")
    if route not in ("revoke",):
        route = "error"
    yield Event(route=route)


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 2: Revoke access — non-Tangoe directly, Tangoe via request only
# ═══════════════════════════════════════════════════════════════════════════════


@node(rerun_on_resume=True)
async def revoke_access(ctx: Any) -> Event:
    sys_id = ctx.state.get("sys_id", "")
    user_id = ctx.state.get("user_id", "")
    user_name = ctx.state.get("user_name", "Unknown")
    user_email = ctx.state.get("user_email", "")
    assigned_servers = ctx.state.get("assigned_servers", [])

    action_log: list[str] = []

    for server in assigned_servers:
        if _is_tangoe(server):
            # Tangoe: direct revocation NOT allowed — submit request only
            result = api.submit_revocation_request(user_id, server)
            success = result.get("status") == "success"
            note = _build_action_log_entry(server, success, is_tangoe=True)
        else:
            # All other servers: revoke immediately
            result = api.revoke_server_access(user_id, server)
            success = result.get("status") == "success"
            note = _build_action_log_entry(server, success)

        api.update_ticket(sys_id, work_notes=f"[Revocation] {note}")
        action_log.append(note)

    # Verify revocation
    try:
        updated_user = api.get_user(user_id)
        remaining = updated_user.get("servers", []) if isinstance(updated_user, dict) else assigned_servers
    except Exception:
        remaining = assigned_servers

    remaining_non_tangoe = [s for s in remaining if not _is_tangoe(s)]
    remaining_tangoe = [s for s in remaining if _is_tangoe(s)]

    parts = []
    if not remaining_non_tangoe:
        parts.append("all non-Tangoe servers successfully removed.")
    else:
        parts.append(f"remaining non-Tangoe servers: {', '.join(remaining_non_tangoe)}.")
    if remaining_tangoe:
        parts.append(f"Tangoe revocation request submitted (awaiting vendor action).")
    else:
        parts.append("No Tangoe access assigned.")

    verify_note = f"[Revocation] Post-revocation check: {' '.join(parts)}"
    api.update_ticket(sys_id, work_notes=verify_note)

    return Event(state={
        "route":      "close",
        "action_log": action_log,
        "remaining":  remaining,
    })


# ── Router after revoke ------------------------------------------------------


def after_revoke_router(ctx: Any, node_input: Any):
    yield Event(route=ctx.state.get("route", "error"))


# ── Terminal stubs -----------------------------------------------------------


@node
async def handle_no_user(ctx: Any) -> Event:
    return Event(message=ctx.state.get("message", "User not found. Ticket closed."))


@node
async def handle_error(ctx: Any) -> Event:
    sys_id = ctx.state.get("sys_id", "")
    error = ctx.state.get("error", "Unknown error.")
    if sys_id:
        api.update_ticket(sys_id, work_notes=f"[Revocation] ERROR: {error}")
    return Event(message=f"Revocation workflow stopped: {error}")


# ═══════════════════════════════════════════════════════════════════════════════
#  STEP 4: Generate summary and close the ticket
# ═══════════════════════════════════════════════════════════════════════════════


@node(rerun_on_resume=True)
async def close_ticket(ctx: Any) -> Event:
    sys_id = ctx.state.get("sys_id", "")
    user_name = ctx.state.get("user_name", "Unknown")
    user_email = ctx.state.get("user_email", "")
    action_log = ctx.state.get("action_log", [])
    remaining = ctx.state.get("remaining", [])

    summary_input = (
        f"User: {user_name} ({user_email})\n"
        f"Actions taken:\n" + "\n".join(action_log) + "\n"
        f"Remaining: {', '.join(remaining) if remaining else '(none)'}"
    )

    summary_result = await ctx.run_node(ticket_closer, node_input=summary_input)
    summary = (
        RevocationSummaryOutput.model_validate(summary_result)
        if isinstance(summary_result, dict)
        else summary_result
    )
    closing_note = summary.summary if summary else "Access revocation workflow completed."

    api.update_ticket(
        sys_id,
        state="Closed",
        work_notes=f"[Revocation] {closing_note}",
    )

    return Event(state={"final": "closed", "message": closing_note})


# ═══════════════════════════════════════════════════════════════════════════════
# Workflow Definition
# ═══════════════════════════════════════════════════════════════════════════════

root_agent = Workflow(
    name="access_revocation_agent",
    description=(
        "3-agent workflow: fetches revocation tickets, checks user's assigned "
        "servers in NM, revokes non-Tangoe servers directly, submits request-only "
        "for Tangoe, updates work notes, and closes the ticket."
    ),
    edges=[
        ("START", check_tickets, check_tickets_router),
        (check_tickets_router, {
            "process_ticket": process_ticket,
            "END":            end,
        }),
        (process_ticket, process_ticket_router),
        (process_ticket_router, {
            "revoke": revoke_access,
            "error":  handle_error,
        }),
        (revoke_access, after_revoke_router),
        (after_revoke_router, {
            "close": close_ticket,
            "error": handle_error,
        }),
    ],
)
