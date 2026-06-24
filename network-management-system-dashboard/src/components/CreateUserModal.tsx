import { useState, useRef, useEffect, FormEvent } from "react";
import { X, Check, Search, Shield, Server as ServerIcon, MapPin, User as UserIcon, Mail, Hash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  LocationType,
  RoleType,
  ROLE_OPTIONS,
  LOCATION_OPTIONS,
  SERVER_OPTIONS,
  LOCATION_SERVERS_MAP,
} from "../types";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Omit<User, "id" | "createdAt">) => void;
  userToEdit?: User | null;
  users: User[];
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  userToEdit,
  users,
}: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState<LocationType>("USA");
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([]);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);

  // Search filter for Server multiselect
  const [serverSearchQuery, setServerSearchQuery] = useState("");

  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const serverDropdownRef = useRef<HTMLDivElement>(null);

  // Load user data if editing
  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmployeeId(userToEdit.employeeId);
      setEmail(userToEdit.email);
      setLocation(userToEdit.location);
      setSelectedRoles(userToEdit.roles);
      setSelectedServers(userToEdit.servers);
    } else {
      setName("");
      setEmployeeId("");
      setEmail("");
      setLocation("USA");
      setSelectedRoles([]);
      setSelectedServers([]);
    }
    setServerSearchQuery("");
    setRoleSearchQuery("");
    setIsRoleDropdownOpen(false);
    setIsServerDropdownOpen(false);
  }, [userToEdit, isOpen]);

  // Click outside handlers for custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (serverDropdownRef.current && !serverDropdownRef.current.contains(event.target as Node)) {
        setIsServerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRoleToggle = (role: RoleType) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleServerToggle = (server: string) => {
    if (selectedServers.includes(server)) {
      setSelectedServers(selectedServers.filter((s) => s !== server && !s.startsWith(server + " -")));
    } else {
      setSelectedServers([...selectedServers, server]);
    }
  };

  const handleLocationChange = (newLoc: LocationType) => {
    setLocation(newLoc);
    const allowed = LOCATION_SERVERS_MAP[newLoc] || [];
    setSelectedServers((prev) =>
      prev.filter((server) => {
        const baseServer = server.split(" - ")[0];
        return allowed.includes(baseServer);
      })
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim() || !email.trim()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      employeeId: employeeId.trim(),
      email: email.trim(),
      location,
      roles: selectedRoles,
      servers: selectedServers,
    });
    onClose();
  };

  const allowedServers = LOCATION_SERVERS_MAP[location] || [];
  const filteredServers = allowedServers.filter((server) =>
    server.toLowerCase().includes(serverSearchQuery.toLowerCase())
  );

  const filteredRoles = ROLE_OPTIONS.filter((role) =>
    role.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          id="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          id="user-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-slate-900 tracking-tight">
                {userToEdit ? "Edit Staff Access & Profile" : "Register New Staff Profile"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure identity details, location, enterprise roles, and server mappings.
              </p>
            </div>
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form id="create-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Primary Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    id="input-fullname"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rachel Green"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/20"
                  />
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Hash className="h-4 w-4" />
                  </span>
                  <input
                    id="input-empid"
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-9321"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/20"
                  />
                </div>
              </div>
            </div>

            {/* Email and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mail ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mail ID (Corporate Email) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rachel@company.com"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/20"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Corporate Location
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <select
                    id="select-location"
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value as LocationType)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/20 appearance-none"
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Multi-Select for Roles */}
            <div ref={roleDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Assign Roles <span className="text-gray-400 font-normal">(Multi-select & Search)</span>
              </label>
              <div
                id="role-dropdown-toggle"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full text-left rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all flex items-center justify-between cursor-pointer min-h-[46px]"
              >
                <div className="flex flex-wrap gap-1.5 items-center max-w-[90%]">
                  {selectedRoles.length === 0 ? (
                    <span className="text-slate-400 font-normal pl-0.5">No roles assigned</span>
                  ) : (
                    selectedRoles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-sm text-xs border border-blue-100 font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {role}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRoleToggle(role);
                          }}
                          className="text-blue-400 hover:text-red-600 font-extrabold text-[10px] ml-1 transform hover:scale-110 transition shrink-0"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <span className="text-slate-400 text-xs shrink-0 select-none">{isRoleDropdownOpen ? "▲" : "▼"}</span>
              </div>

              {isRoleDropdownOpen && (
                <div className="absolute z-60 mt-1 w-full rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 space-y-1 max-h-56 overflow-y-auto">
                  {/* Search inside Roles dropdown */}
                  <div className="sticky top-0 bg-white pb-2 pt-1 px-1 border-b border-slate-100 mb-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        id="role-search-input"
                        type="text"
                        value={roleSearchQuery}
                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                        placeholder="Search roles..."
                        className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                      />
                      {roleSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRoleSearchQuery("")}
                          className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredRoles.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No matching roles</p>
                  ) : (
                    filteredRoles.map((role) => {
                      const isSelected = selectedRoles.includes(role);
                      return (
                        <button
                          key={role}
                          id={`role-option-${role.replace(/\s+/g, "-")}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRoleToggle(role);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors ${
                            isSelected
                              ? "bg-blue-50/50 text-blue-900 font-medium"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Shield className={`h-3.5 w-3.5 ${isSelected ? "text-blue-500" : "text-slate-400"}`} />
                            {role}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Custom Multi-Select with Search for Infrastructure Servers */}
            <div ref={serverDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Grant Server Access <span className="text-gray-400 font-normal">(Multi-select & Search)</span>
              </label>
              <div
                id="server-dropdown-toggle"
                onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
                className="w-full text-left rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all flex items-center justify-between cursor-pointer min-h-[46px]"
              >
                <div className="flex flex-wrap gap-1.5 items-center max-w-[90%]">
                  {selectedServers.length === 0 ? (
                    <span className="text-slate-400 font-normal pl-0.5">No servers mapped</span>
                  ) : (
                    selectedServers.map((server) => {
                      const isSubOption = server.includes(" - ");
                      return (
                        <span
                          key={server}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold border transition shrink-0 ${
                            isSubOption
                              ? "bg-indigo-50/25 text-indigo-600 border-dashed border-indigo-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate max-w-[170px]">
                            {isSubOption ? server.split(" - ")[1] : server}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSubOption) {
                                setSelectedServers(selectedServers.filter((s) => s !== server));
                              } else {
                                handleServerToggle(server);
                              }
                            }}
                            className="text-indigo-400 hover:text-red-600 font-extrabold text-[10px] ml-1 transform hover:scale-110 transition shrink-0"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <span className="text-slate-400 text-xs shrink-0 select-none">{isServerDropdownOpen ? "▲" : "▼"}</span>
              </div>

              {isServerDropdownOpen && (
                <div className="absolute z-60 mt-1 w-full rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 space-y-1 max-h-72 overflow-y-auto">
                  {/* Search bar within dropdown */}
                  <div className="sticky top-0 bg-white pb-2 pt-1 px-1 border-b border-slate-100 mb-2" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        id="server-search-input"
                        type="text"
                        value={serverSearchQuery}
                        onChange={(e) => setServerSearchQuery(e.target.value)}
                        placeholder="Search system profiles..."
                        className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50"
                      />
                      {serverSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setServerSearchQuery("")}
                          className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredServers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No matching server options</p>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredServers.map((server) => {
                        const isSelected = selectedServers.includes(server);
                        const isPhoneProfile = server.toLowerCase().includes("phone profile");
                        const showSubOptions = isSelected && isPhoneProfile;

                        return (
                          <div key={server} className="space-y-1">
                            <button
                              id={`server-option-${server.replace(/[^\w]/g, "-")}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServerToggle(server);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors ${
                                isSelected
                                  ? "bg-indigo-50/50 text-indigo-900 font-medium"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <ServerIcon className={`h-3 w-3 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} />
                                <span className="truncate max-w-[340px]">{server}</span>
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                            </button>

                            {showSubOptions && (
                              <div className="pl-6 pr-2 py-1 space-y-1 bg-slate-50/70 rounded-lg border border-slate-100/80 ml-3">
                                {["Soft Phone", "Desk Phone"].map((subOption) => {
                                  const subOptionValue = `${server} - ${subOption}`;
                                  const isSubSelected = selectedServers.includes(subOptionValue);

                                  return (
                                    <button
                                      key={subOption}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSubSelected) {
                                          setSelectedServers(selectedServers.filter((s) => s !== subOptionValue));
                                        } else {
                                          setSelectedServers([...selectedServers, subOptionValue]);
                                        }
                                      }}
                                      className="w-full flex items-center justify-between py-1 text-[11px] text-left cursor-pointer"
                                    >
                                      <span className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isSubSelected}
                                          onChange={() => {}} // Handled by button click
                                          className="h-3 w-3 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                                        />
                                        <span className={isSubSelected ? "font-semibold text-indigo-950 flex items-center gap-1.5" : "text-slate-600 flex items-center gap-1.5"}>
                                          {subOption}
                                        </span>
                                      </span>
                                      {isSubSelected && (
                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold text-[9px] scale-90">
                                          Active
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-5 px-6 py-4 mt-6">
              <button
                id="cancel-modal-btn"
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                id="save-modal-btn"
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs hover:shadow-md"
              >
                {userToEdit ? "Update Directory" : "Create Profile"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
