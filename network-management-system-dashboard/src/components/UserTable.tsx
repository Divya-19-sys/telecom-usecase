import { useState } from "react";
import { ListFilter, Search, UserCheck, ShieldAlert, Edit2, Trash2, MapPin } from "lucide-react";
import { User, RoleType, LocationType } from "../types";

interface UserTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserTable({ users, onEditUser, onDeleteUser }: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [locationFilter, setLocationFilter] = useState<string>("All");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "All" || user.roles.includes(roleFilter as RoleType);
    const matchesLocation = locationFilter === "All" || user.location === locationFilter;

    return matchesSearch && matchesRole && matchesLocation;
  });

  return (
    <div id="user-list-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Table Action Bar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-500" />
            Registered Staff Directory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ({filteredUsers.length} of {users.length} users shown)
          </p>
        </div>

        {/* Filters and Search Container */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="user-search-field"
              type="text"
              placeholder="Search by name, ID, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-1.5 pl-9 pr-3 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white"
            />
          </div>

          {/* Role Filter */}
          <select
            id="user-filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/15"
          >
            <option value="All">All Roles</option>
            <option value="Developer">Developer</option>
            <option value="Manager">Manager</option>
            <option value="Tele Caller">Tele Caller</option>
            <option value="HR">HR</option>
            <option value="IT Admin">IT Admin</option>
          </select>

          {/* Location Filter */}
          <select
            id="user-filter-location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/15"
          >
            <option value="All">All Locations</option>
            <option value="USA">USA</option>
            <option value="Canada">Canada</option>
            <option value="India">India</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table id="profile-users-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Employee ID</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Server Access</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <ListFilter className="h-10 w-10 text-slate-300 stroke-[1.5] mb-2" />
                    <p className="text-sm font-semibold">No users found matching current criteria</p>
                    <p className="text-xs mt-1">Try updating your filters or add a new user profile.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/40 transition">
                  {/* Name column */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                    </div>
                  </td>

                  {/* Employee ID column */}
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/40 border border-indigo-100/55 rounded-md px-2 py-1 inline-flex items-center">
                      {user.employeeId}
                    </div>
                  </td>

                  {/* Role column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {role}
                        </span>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No role</span>
                      )}
                    </div>
                  </td>

                  {/* Server Access column */}
                  <td className="px-6 py-4">
                    {(() => {
                      const userServers = Array.isArray(user.servers) ? user.servers : [];
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 font-bold text-[10px]">
                              {userServers.length} mapped
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                              {user.location}
                            </span>
                          </div>
                          
                          {/* Short list of active servers */}
                          {userServers.length > 0 && (
                            <div className="text-[10px] text-slate-400 line-clamp-1 truncate max-w-[220px]">
                              {userServers.join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Actions column */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        id={`edit-user-btn-${user.id}`}
                        onClick={() => onEditUser(user)}
                        title="Edit User Profile"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        id={`delete-user-btn-${user.id}`}
                        onClick={() => onDeleteUser(user.id)}
                        title="Delete User"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
