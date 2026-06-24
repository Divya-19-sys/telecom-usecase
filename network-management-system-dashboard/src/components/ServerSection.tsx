import { useState } from "react";
import { ShieldX, Search, Radio, Server, CheckCircle, Clock, Send, X } from "lucide-react";
import { User, SERVERS_CONFIG, SectionType, TangoeRevokeRequest } from "../types";

interface ServerSectionProps {
  section: Exclude<SectionType, "Profile">;
  users: User[];
  onRevoke: (userId: string, serverOption: string) => void;
  tangoeRequests?: TangoeRevokeRequest[];
}

export default function ServerSection({
  section,
  users,
  onRevoke,
  tangoeRequests = [],
}: ServerSectionProps) {
  const config = SERVERS_CONFIG[section];
  
  // Set default active button to the first one available
  const [activeButton, setActiveButton] = useState(config.buttons[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const targetMappingString = config.buttonMapping[activeButton];

  // Filter users who have access to the target mapping string
  const filteredUsers = users.filter((user) => {
    const userServers = Array.isArray(user.servers) ? user.servers : [];
    const hasAccess = userServers.includes(targetMappingString) ||
      userServers.some((s) => s.startsWith(`${targetMappingString} -`));
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return hasAccess && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold mb-2">
              <Server className="h-3 w-3" />
              Active System Cluster
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {config.label} Infrastructure Management
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Select an access profile mode below to view provisioned directories and revoke authorization.
            </p>
          </div>

          {/* Quick search */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="server-user-search-field"
              type="text"
              placeholder="Search current server directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-1.5 pl-9 pr-3 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Dynamic Buttons Panel */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Access Profiles / Interfaces
          </div>
          
          <div className="flex flex-wrap gap-2">
            {config.buttons.map((btn) => {
              const isActive = activeButton === btn;
              const mappedString = config.buttonMapping[btn];
              const countOnThisBtn = users.filter((u) => {
                const userServers = Array.isArray(u.servers) ? u.servers : [];
                return userServers.includes(mappedString);
              }).length;

              return (
                <button
                  key={btn}
                  id={`server-sub-tab-${btn.replace(/\s+/g, "-")}`}
                  onClick={() => {
                    setActiveButton(btn);
                    setSearchQuery(""); // clear search on sub-tab change
                  }}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  <Radio className={`h-3.5 w-3.5 ${isActive ? "text-blue-400 animate-pulse" : "text-slate-400"}`} />
                  {btn}
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200/60 text-slate-600"
                    }`}
                  >
                    {countOnThisBtn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeButton} Registry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Profile Mappings: <code className="font-mono text-indigo-600 text-[11px] font-semibold">{targetMappingString}</code>
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-sm">
            {filteredUsers.length} Active Key{filteredUsers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center max-w-sm mx-auto">
            <div className="flex justify-center mb-3">
              <span className="p-3 bg-slate-100 text-slate-400 rounded-full">
                <CheckCircle className="h-6 w-6 stroke-[1.5]" />
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No Authorized Staff Found</h4>
            <p className="text-xs text-slate-500 mt-2">
              No staff members are currently mapped to the <strong className="text-slate-700 font-medium">{activeButton}</strong> profile on this server clusters.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add this option to a staff member's profile inside the primary Directory Section.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3.5">Assigned User</th>
                  <th className="px-6 py-3.5">Employee ID</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Enterprise Roles</th>
                  <th className="px-6 py-3.5 text-right">Access Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/50 border border-indigo-100/60 rounded px-2 py-0.5 inline-block">
                        {user.employeeId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 font-medium">{user.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {targetMappingString.toLowerCase().includes("phone profile") ? (
                        <div className="flex flex-col items-end gap-2 text-right">
                          {(() => {
                            const softPhoneServerString = user.servers.find(s => s.startsWith(`${targetMappingString} - Soft Phone`));
                            const deskPhoneServerString = user.servers.find(s => s.startsWith(`${targetMappingString} - Desk Phone`));

                            return (
                              <>
                                {softPhoneServerString && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md">
                                      Soft Phone
                                    </span>
                                    <button
                                      type="button"
                                      id={`revoke-soft-${user.id}`}
                                      onClick={() => onRevoke(user.id, softPhoneServerString)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-650 hover:text-white hover:border-red-650 cursor-pointer transition duration-150"
                                    >
                                      <ShieldX className="h-3 w-3 shrink-0" />
                                      Revoke
                                    </button>
                                  </div>
                                )}
                                {deskPhoneServerString && (
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const extMatch = deskPhoneServerString.match(/\((\d{5})\)/);
                                      const extNo = extMatch ? extMatch[1] : "";
                                      return (
                                        <>
                                          <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-750 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            Desk Phone {extNo && <span className="font-mono text-[9px] text-indigo-600 bg-white/80 px-1 py-0.2 border border-indigo-100 rounded">Ext: {extNo}</span>}
                                          </span>
                                          <button
                                            type="button"
                                            id={`revoke-desk-${user.id}`}
                                            onClick={() => onRevoke(user.id, deskPhoneServerString)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer transition duration-150"
                                          >
                                            <ShieldX className="h-3 w-3 shrink-0" />
                                            Revoke
                                          </button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                                {!softPhoneServerString && !deskPhoneServerString && (
                                  <button
                                    type="button"
                                    id={`revoke-btn-${user.id}-${targetMappingString.replace(/[^\w]/g, "-")}`}
                                    onClick={() => onRevoke(user.id, targetMappingString)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer transition duration-150"
                                  >
                                    <ShieldX className="h-3.5 w-3.5 shrink-0" />
                                    Revoke Access
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`revoke-btn-${user.id}-${targetMappingString.replace(/[^\w]/g, "-")}`}
                          onClick={() => onRevoke(user.id, targetMappingString)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 cursor-pointer transition duration-150"
                        >
                          <ShieldX className="h-3.5 w-3.5 shrink-0" />
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Vendor Requests Panel for TANGOE */}
      {section === "TANGOE" && (
        <div id="tangoe-requests-panel" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b border-slate-100 bg-amber-50/20 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="h-4 w-4 text-amber-600" />
                Tangoe Vendor Revocation Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Requests raised directly to the external vendor team for approval and ticket processing.
              </p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-900 border border-amber-100 font-bold px-2.5 py-0.5 rounded-sm">
              {tangoeRequests.length} Raised Ticket{tangoeRequests.length !== 1 ? "s" : ""}
            </span>
          </div>

          {tangoeRequests.length === 0 ? (
            <div className="px-6 py-12 text-center max-w-sm mx-auto">
              <div className="flex justify-center mb-2.5">
                <span className="p-2.5 bg-slate-50 text-slate-400 rounded-full">
                  <Clock className="h-5 w-5 stroke-[1.5]" />
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-700">No raised requests currently registered</h4>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Requests will show here once you click Revoke next to any employee listed in the registry above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Employee ID</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Vendor Descr / Reason</th>
                    <th className="px-5 py-3">Submitted At</th>
                    <th className="px-5 py-3 text-right">Route Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70">
                  {tangoeRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/20 transition text-[11px]">
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-slate-800">{req.name}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/60 rounded px-1.5 py-0.5">
                          {req.employeeId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {req.location}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs break-words">
                        {req.description}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {new Date(req.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
