import requests
from json import JSONDecodeError

# ─── Configuration ────────────────────────────────────────────────────────────

SERVICENOW_URL   = "http://localhost:3000"   # Incidents / ServiceNow server
NETWORK_MGMT_URL = "http://localhost:3001"   # Users / Network Management server


def _safe_json(response: requests.Response, fallback=None):
    """Safely parse JSON — returns `fallback` on empty / non‑JSON response."""
    if not response.text or not response.text.strip():
        return fallback
    try:
        return response.json()
    except JSONDecodeError:
        return fallback
 
# ══════════════════════════════════════════════════════════════════════════════
#  SERVICENOW  –  Incident / Ticket APIs
# ══════════════════════════════════════════════════════════════════════════════


def fetch_requests(state="open"):
    """Fetch revocation tickets by state (default: open)."""
    response = requests.get(f"{SERVICENOW_URL}/api/incidents", params={"state": state})
    response.raise_for_status()
    data = _safe_json(response, {})
    records = data.get("data", data) if isinstance(data, dict) else data
    if isinstance(records, list):
        for r in records:
            r["sys_id"] = r.get("id", "")
            r["caller"] = r.get("name", "")
            r["email"] = r.get("mailAddress", "")
            r["short_description"] = r.get("description", "")
            r["state"] = r.get("status", "")
    return records


def update_ticket(sys_id, state=None, work_notes=None):
    """Update a ticket's state and/or append a work note."""
    payload = {}
    if state:
        payload["state"] = state
    if work_notes:
        payload["work_notes"] = work_notes
    response = requests.patch(f"{SERVICENOW_URL}/api/incidents/{sys_id}", json=payload)
    response.raise_for_status()
    data = _safe_json(response, {})
    return data.get("data", data) if isinstance(data, dict) else data


def submit_revocation_request(user_id, server):
    """Submit a Tangoe revocation request (request, not direct revoke)."""
    payload = {"userId": user_id, "server": server, "type": "revocation_request"}
    response = requests.post(f"{NETWORK_MGMT_URL}/api/users/{user_id}/revocation-request", json=payload)
    response.raise_for_status()
    return _safe_json(response, {})


# ══════════════════════════════════════════════════════════════════════════════
#  SERVICENOW  –  Incident APIs
# ══════════════════════════════════════════════════════════════════════════════
 
def get_all_incidents():
    """Fetch every incident in the system."""
    response = requests.get(f"{SERVICENOW_URL}/api/incidents")
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def create_incident(name, employee_id, mail_address, description,
                    roles=None, location="USA", status="Open"):
    """Open a new incident ticket."""
    payload = {
        "name":        name,
        "employeeId":  employee_id,
        "mailAddress": mail_address,
        "description": description,
        "roles":       roles or [],
        "location":    location,
        "status":      status,
    }
    response = requests.post(f"{SERVICENOW_URL}/api/incidents", json=payload)
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def update_incident_status(incident_id, status):
    """Change the status of an incident (e.g. 'Open', 'In Progress')."""
    payload = {"status": status}
    response = requests.put(
        f"{SERVICENOW_URL}/api/incidents/{incident_id}/status", json=payload
    )
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def resolve_incident(incident_id):
    """Mark an incident as Resolved."""
    response = requests.put(f"{SERVICENOW_URL}/api/incidents/{incident_id}/resolve")
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def close_incident(incident_id):
    """Formally close an incident and revoke its access tokens."""
    response = requests.put(f"{SERVICENOW_URL}/api/incidents/{incident_id}/close")
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def add_work_note(incident_id, content, updated_by="Divya D."):
    """Append a work note to an existing incident."""
    payload = {"content": content, "updatedBy": updated_by}
    response = requests.post(
        f"{SERVICENOW_URL}/api/incidents/{incident_id}/notes", json=payload
    )
    response.raise_for_status()
    return _safe_json(response, {})
 
 
# ══════════════════════════════════════════════════════════════════════════════
#  NETWORK MANAGEMENT  –  User APIs
# ══════════════════════════════════════════════════════════════════════════════
 
def health_check():
    """Ping the Network Management service."""
    response = requests.get(f"{NETWORK_MGMT_URL}/api/health")
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def get_all_users():
    """Retrieve all registered users."""
    response = requests.get(f"{NETWORK_MGMT_URL}/api/users")
    response.raise_for_status()
    raw = _safe_json(response, {})
    # Unwrap common container formats — same pattern as fetch_requests()
    if isinstance(raw, dict):
        for key in ("data", "users", "records"):
            inner = raw.get(key)
            if isinstance(inner, list):
                return inner
        return []                     # no usable list found
    if isinstance(raw, list):
        return raw
    return []


get_users = get_all_users


def get_user(user_id):
    """Fetch a single user by ID from Network Management."""
    response = requests.get(f"{NETWORK_MGMT_URL}/api/users/{user_id}")
    response.raise_for_status()
    data = _safe_json(response, {})
    return data.get("data", data) if isinstance(data, dict) else data
 
 
def create_user(name, employee_id, email, location,
                roles=None, servers=None):
    """Register a new user.
    location must be one of: 'USA', 'Canada', 'India'
    """
    payload = {
        "name":       name,
        "employeeId": employee_id,
        "email":      email,
        "location":   location,
        "roles":      roles   or [],
        "servers":    servers or [],
    }
    response = requests.post(f"{NETWORK_MGMT_URL}/api/users", json=payload)
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def update_user(user_id, **fields):
    """Update any fields on an existing user.
    Pass only the fields you want to change, e.g.:
        update_user("user-1", roles=["Manager"], location="USA")
    """
    response = requests.put(f"{NETWORK_MGMT_URL}/api/users/{user_id}", json=fields)
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def delete_user(user_id):
    """Permanently remove a user."""
    response = requests.delete(f"{NETWORK_MGMT_URL}/api/users/{user_id}")
    response.raise_for_status()
    return _safe_json(response, {})
 
 
def revoke_server_access(user_id, server):
    """Remove a specific server permission from a user.
    e.g. revoke_server_access("user-1", "Tangoe")
    """
    payload = {"server": server}
    response = requests.post(
        f"{NETWORK_MGMT_URL}/api/users/{user_id}/revoke", json=payload
    )
    response.raise_for_status()
    data = _safe_json(response, {})
    return {"status": "success", "servers": data.get("servers", [])}
 
 
# ══════════════════════════════════════════════════════════════════════════════
#  Quick demo  –  remove or adapt as needed
# ══════════════════════════════════════════════════════════════════════════════
 
if __name__ == "__main__":
    # --- ServiceNow examples ---
    print("=== ServiceNow ===")
 
    incidents = get_all_incidents()
    print(f"Total incidents: {len(incidents)}")
 
    new_incident = create_incident(
        name="Jane Doe",
        employee_id="EMP-1234",
        mail_address="jane.doe@enterprise.com",
        description="Cannot access VPN after password reset.",
        roles=["Developer"],
        location="India",
    )
    print(f"Created incident: {new_incident['id']}")
 
    updated = update_incident_status(new_incident["id"], "In Progress")
    print(f"Status updated to: {updated['status']}")
 
    noted = add_work_note(new_incident["id"], "Contacted user, investigating credentials.")
    print(f"Work note added. Total notes: {len(noted['workNotes'])}")
 
    resolved = resolve_incident(new_incident["id"])
    print(f"Incident resolved: {resolved['status']}")
 
    closed = close_incident(new_incident["id"])
    print(f"Incident closed: {closed['status']}")
 
    # --- Network Management examples ---
    print("\n=== Network Management ===")
 
    print(f"Health check: {health_check()}")
 
    users = get_all_users()
    print(f"Total users: {len(users)}")
 
    new_user = create_user(
        name="Chandler Bing",
        employee_id="EMP-5678",
        email="chandler.b@enterprise.com",
        location="USA",
        roles=["IT Admin"],
        servers=["Tangoe", "GCC CUCM (Device Profile)"],
    )
    print(f"Created user: {new_user['id']} – {new_user['name']}")
 
    updated_user = update_user(new_user["id"], roles=["IT Admin", "Manager"])
    print(f"Updated roles: {updated_user['roles']}")
 
    revoked = revoke_server_access(new_user["id"], "Tangoe")
    print(f"Remaining servers after revoke: {revoked['servers']}")
 
    deleted = delete_user(new_user["id"])
    print(f"Delete result: {deleted['message']}")
 