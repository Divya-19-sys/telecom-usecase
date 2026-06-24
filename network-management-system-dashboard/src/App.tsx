import { useState, useEffect, FormEvent } from "react";
import {
  Users,
  Server,
  Key,
  Shield,
  Layers,
  PhoneCall,
  Activity,
  Plus,
  ArrowLeft,
  CheckCircle,
  MapPin,
  HelpCircle,
  TrendingUp,
  Sliders,
  ChevronRight,
  Sparkles,
  Info,
  X,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, SectionType, SERVERS_CONFIG, TangoeRevokeRequest, LocationType } from "./types";
import CreateUserModal from "./components/CreateUserModal";
import UserTable from "./components/UserTable";
import ServerSection from "./components/ServerSection";

const INITIAL_SEED_USERS: User[] = [
  {
    id: "user-1",
    name: "Rachel Green",
    employeeId: "EMP-7301",
    email: "rachel.g@enterprise.com",
    location: "India",
    roles: ["Developer", "IT Admin"],
    servers: ["PCUCM (Device Profile)", "SCUCM (Phone Profile)", "CUCM Unity"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-2",
    name: "Ross Geller",
    employeeId: "EMP-8492",
    email: "ross.g@enterprise.com",
    location: "USA",
    roles: ["Manager"],
    servers: ["GCC CUCM (Device Profile)", "Tangoe"],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-3",
    name: "Monica Geller",
    employeeId: "EMP-9430",
    email: "monica.g@enterprise.com",
    location: "India",
    roles: ["Tele Caller", "HR"],
    servers: ["PCUCM (Phone Profile)", "SCUCM (Phone Profile)", "GCC Unity", "Tangoe"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeSection, setActiveSection] = useState<SectionType | "Hub">("Hub");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // States for Tangoe special revoke request
  const [tangoeRequests, setTangoeRequests] = useState<TangoeRevokeRequest[]>(() => {
    try {
      const saved = localStorage.getItem("TANGOE_REVOKE_REQUESTS");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [tangoeRevokeUser, setTangoeRevokeUser] = useState<User | null>(null);

  useEffect(() => {
    localStorage.setItem("TANGOE_REVOKE_REQUESTS", JSON.stringify(tangoeRequests));
  }, [tangoeRequests]);
  
  // Custom Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Helper to safely normalize legacy or undefined properties
  const normalizeUser = (u: any): User => {
    if (!u) return u;
    let loc = u.location;
    if (loc === "Hyderabad User") loc = "India";
    else if (loc === "Other User") loc = "USA";
    else if (!loc || (loc !== "USA" && loc !== "Canada" && loc !== "India")) loc = "USA";

    return {
      ...u,
      location: loc,
      roles: Array.isArray(u.roles) ? u.roles : [],
      servers: Array.isArray(u.servers)
        ? u.servers
        : (typeof u.servers === "string" && u.servers ? [u.servers] : []),
    };
  };

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch users from backend API
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers((Array.isArray(data) ? data : []).map(normalizeUser));
      } else {
        const stored = localStorage.getItem("SAM_DASHBOARD_USERS");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUsers((Array.isArray(parsed) ? parsed : []).map(normalizeUser));
          } catch (e) {
            setUsers(INITIAL_SEED_USERS);
          }
        } else {
          setUsers(INITIAL_SEED_USERS);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users from server", err);
      const stored = localStorage.getItem("SAM_DASHBOARD_USERS");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUsers((Array.isArray(parsed) ? parsed : []).map(normalizeUser));
        } catch (e) {
          setUsers(INITIAL_SEED_USERS);
        }
      } else {
        setUsers(INITIAL_SEED_USERS);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create or Edit user form submitted via backend API
  const handleFormSubmit = async (formData: Omit<User, "id" | "createdAt">) => {
    if (userToEdit) {
      try {
        const response = await fetch(`/api/users/${userToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updatedUser = await response.json();
          setUsers(users.map((u) => u.id === userToEdit.id ? normalizeUser(updatedUser) : u));
          showToast(`Successfully updated credentials for ${formData.name}.`);
        } else {
          showToast("Failed to update user on backend", "error");
        }
      } catch (err) {
        console.error("Edit user failed", err);
        showToast("Error updating user", "error");
      }
    } else {
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const newUser = await response.json();
          setUsers([normalizeUser(newUser), ...users]);
          showToast(`Successfully registered and provisioned ${formData.name}.`);
        } else {
          showToast("Failed to create user on backend", "error");
        }
      } catch (err) {
        console.error("Create user failed", err);
        showToast("Error creating user", "error");
      }
    }
    setUserToEdit(null);
  };

  const [tangoeDescription, setTangoeDescription] = useState("");

  const handleTangoeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tangoeRevokeUser) return;
    if (!tangoeDescription.trim()) {
      showToast("Please provide a description/reason for the revocation request", "error");
      return;
    }

    const newRequest: TangoeRevokeRequest = {
      id: `tangoe-req-${Date.now()}`,
      userId: tangoeRevokeUser.id,
      name: tangoeRevokeUser.name,
      employeeId: tangoeRevokeUser.employeeId,
      location: tangoeRevokeUser.location,
      description: tangoeDescription.trim(),
      createdAt: new Date().toISOString(),
      status: "Pending Vendor Action",
    };

    setTangoeRequests([newRequest, ...tangoeRequests]);
    setTangoeDescription("");
    setTangoeRevokeUser(null);
    showToast(`Ticket successfully raised to the Tangoe team for employee ID ${newRequest.employeeId}.`, "success");

    // Now revoke Tangoe access from the user's servers
    await revokeTangoeAccess(newRequest.userId);
    const updated = users.map((u) =>
      u.id === newRequest.userId
        ? { ...u, servers: u.servers.filter((s) => s !== "Tangoe") }
        : u
    );
    setUsers(updated);
  };

  const handleEditRequest = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        showToast(`Successfully deleted ${target.name} from the access system.`, "error");
      } else {
        showToast("Failed to delete user on backend", "error");
      }
    } catch (err) {
      console.error("Delete user failed", err);
      showToast("Error deleting user", "error");
    }
  };

  // Revoke server access dynamically via backend API call
  const handleRevokePermission = async (userId: string, serverOptionString: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // For Tangoe: only open the revocation request modal — no direct revoke
    if (serverOptionString === "Tangoe") {
      setTangoeRevokeUser(targetUser);
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server: serverOptionString }),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map((u) => u.id === userId ? normalizeUser(updatedUser) : u));
        showToast(`Revoked [${serverOptionString}] mapping for ${targetUser.name}.`, "info");
      } else {
        showToast("Failed to revoke permission on backend", "error");
        return;
      }
    } catch (err) {
      console.error("Revoke permission failed", err);
      showToast("Error revoking permission", "error");
      return;
    }
  };

  // Revoke Tangoe access from backend when the vendor ticket is submitted
  const revokeTangoeAccess = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server: "Tangoe" }),
      });
    } catch (err) {
      console.error("Failed to revoke Tangoe access on backend", err);
    }
  };

  // Calculate high-quality analytics counters
  const totalUsers = users.length;
  const usaUsersCount = users.filter((u) => u.location === "USA").length;
  const canadaUsersCount = users.filter((u) => u.location === "Canada").length;
  const indiaUsersCount = users.filter((u) => u.location === "India").length;
  const activeServersCount = 6; // Fixed count of clusters

  // Get count of members in a specific section
  const getSectionUserCount = (sectionId: Exclude<SectionType, "Profile">) => {
    const config = SERVERS_CONFIG[sectionId];
    const targetOptionValues = Object.values(config.buttonMapping);
    
    // Sum unique users who have any of these server options
    return users.filter((u) => {
      const userServers = Array.isArray(u.servers) ? u.servers : [];
      return userServers.some((s) => targetOptionValues.includes(s));
    }).length;
  };

  return (
    <div id="app-container" className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Dark Sidebar Navigation conforming to Sleek Interface */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 shadow-xl z-20">
        {/* App Title Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/25">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-sm block">Network Management System</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Network Directory</span>
          </div>
        </div>

        {/* Navigation Stack */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-slate-500 text-[10px] uppercase font-extrabold tracking-wider px-3 mb-2">
            System Console
          </div>
          
          {/* Hub Tab Button */}
          <button
            id="sidebar-tab-hub"
            onClick={() => setActiveSection("Hub")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "Hub"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-sm">Dashboard Hub</span>
          </button>

          <div className="text-slate-500 text-[10px] uppercase font-extrabold tracking-wider px-3 pt-4 mb-2">
            Identities
          </div>

          {/* Profile Tab Button */}
          <button
            id="sidebar-tab-profile"
            onClick={() => setActiveSection("Profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "Profile"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-sm">Profile Directory</span>
          </button>

          <div className="text-slate-500 text-[10px] uppercase font-extrabold tracking-wider px-3 pt-4 mb-2">
            Servers Nodes
          </div>

          {/* PCUCM Tab */}
          <button
            id="sidebar-tab-pcucm"
            onClick={() => setActiveSection("PCUCM")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "PCUCM"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Server className="w-4 h-4" />
            <span className="text-xs font-semibold">PCUCM Node</span>
          </button>

          {/* SCUCM Tab */}
          <button
            id="sidebar-tab-scucm"
            onClick={() => setActiveSection("SCUCM")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "SCUCM"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Server className="w-4 h-4" />
            <span className="text-xs font-semibold">SCUCM Node</span>
          </button>

          {/* CUCM UNITY Tab */}
          <button
            id="sidebar-tab-cucm-unity"
            onClick={() => setActiveSection("CUCM_UNITY")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "CUCM_UNITY"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="text-xs font-semibold">CUCM Unity VM</span>
          </button>

          {/* GCC CUCM Tab */}
          <button
            id="sidebar-tab-gcc-cucm"
            onClick={() => setActiveSection("GCC_CUCM")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "GCC_CUCM"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Server className="w-4 h-4" />
            <span className="text-xs font-semibold">GCC CUCM Cluster</span>
          </button>

          {/* GCC CUCM UNITY Tab */}
          <button
            id="sidebar-tab-gcc-cucm-unity"
            onClick={() => setActiveSection("GCC_CUCM_UNITY")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "GCC_CUCM_UNITY"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span className="text-xs font-semibold">GCC Unity vm</span>
          </button>

          {/* TANGOE Tab */}
          <button
            id="sidebar-tab-tangoe"
            onClick={() => setActiveSection("TANGOE")}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition duration-150 cursor-pointer ${
              activeSection === "TANGOE"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-xs font-semibold">Tangoe Stacks</span>
          </button>
        </nav>

        {/* Sync Monitor */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active System</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          </div>
          <p className="text-sm font-bold text-slate-200">99.8% Sync Status</p>
          <p className="text-[10px] text-slate-500">Nodes actively responding</p>
        </div>
      </aside>

      {/* Main Workspace Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Panel */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {activeSection !== "Hub" && (
              <button
                id="btn-nav-back"
                onClick={() => setActiveSection("Hub")}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Hub</span>
              </button>
            )}
            <h1 className="text-lg font-bold text-slate-850 tracking-tight">
              Network Access Management Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Admin</p>
              <p className="text-xs font-medium text-slate-700">divyad19092004@gmail.com</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs select-none shadow-xs">
              AD
            </div>
          </div>
        </header>

        {/* Dynamic Toast Notification Banner inside workspace */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-20 right-6 z-50 max-w-sm"
            >
              <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white ${
                toast.type === "success" 
                  ? "border-green-100 text-green-800" 
                  : toast.type === "error" 
                  ? "border-red-100 text-red-800" 
                  : "border-blue-100 text-blue-800"
              }`}>
                <CheckCircle className={`h-5 w-5 shrink-0 ${
                  toast.type === "success" ? "text-green-500" : toast.type === "error" ? "text-red-500" : "text-blue-500"
                }`} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Notification</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Container Panel for Pages */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/50">
          
          {/* WORKSPACE VIEW ROUTER */}
          <AnimatePresence mode="wait">
            {activeSection === "Hub" && (
              <motion.div
                key="hub-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Dynamic Welcome Billboard Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-50/40 to-transparent pointer-events-none" />
                  
                  <div className="space-y-2 z-10">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      System Telephony Control Hub
                    </h2>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      Efficiently provision profiles, map server boundaries, and control active credentials dynamically across UC & directory stacks.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 text-[10px]">
                        <Sparkles className="h-3 w-3" />
                        Dynamic State Propagation Active
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[10px]">
                        <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                        6 Cluster Node Monitors Synchronized
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 z-10">
                    <button
                      id="btn-billboard-create-user"
                      onClick={() => {
                        setUserToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs tracking-tight hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/10 transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Register New Staff User
                    </button>
                  </div>
                </div>

                {/* Grid analytics and statistics cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Registered Users</span>
                    <span className="text-2xl font-bold font-mono text-slate-800 block mt-1">{totalUsers}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Dynamic profiles synchronized</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Regional Sites Mapped</span>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="py-1">
                        <span className="text-xl font-bold font-mono block text-slate-800">{usaUsersCount}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">USA</span>
                      </div>
                      <div className="py-1 border-x border-slate-100">
                        <span className="text-xl font-bold font-mono block text-slate-800">{canadaUsersCount}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Canada</span>
                      </div>
                      <div className="py-1">
                        <span className="text-xl font-bold font-mono block text-slate-800">{indiaUsersCount}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">India</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-none shadow-md shadow-blue-500/10">
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">System Status</span>
                    <span className="text-2xl font-bold font-mono block mt-1">99.8% Sync</span>
                    <span className="text-[10px] text-blue-100 mt-1 block">7 active endpoint pools configured</span>
                  </div>
                </div>

                {/* Bento Directory Hub & Clusters Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Directory Nodes
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium font-mono">Dynamic monitoring</p>
                  </div>

                  {/* Grid container with the 7 core requirements cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    
                    {/* CARD 1: Profile */}
                    <div
                      id="section-card-profile"
                      onClick={() => setActiveSection("Profile")}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 cursor-pointer transition flex flex-col justify-between h-40 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition duration-300 text-blue-600">
                        <Users className="h-24 w-24" />
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 ring-4 ring-blue-50/30">
                          <Users className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-1.5 py-0.5 rounded-sm">
                          Primary System
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-blue-600 transition">
                          Profile List
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Manage master profiles and staff credentials
                        </p>
                      </div>

                      <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Staff Directory</span>
                        <span className="font-mono text-slate-700 font-bold">{totalUsers} Profiles</span>
                      </div>
                    </div>

                    {/* CARD 2: PCUCM */}
                    <div
                      id="section-card-pcucm"
                      onClick={() => setActiveSection("PCUCM")}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 cursor-pointer transition flex flex-col justify-between h-40 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition text-slate-600">
                        <Server className="h-24 w-24" />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                          <Server className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded-sm border border-slate-200">
                          Primary Node
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-blue-600 transition">
                          PCUCM
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Device, Phone, and Device & Phone Profile mappings
                        </p>
                      </div>

                      <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Access Sets</span>
                        <span className="font-mono text-slate-700 font-bold">{getSectionUserCount("PCUCM")} Users</span>
                      </div>
                    </div>

                    {/* CARD 3: SCUCM */}
                    <div
                      id="section-card-scucm"
                      onClick={() => setActiveSection("SCUCM")}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 cursor-pointer transition flex flex-col justify-between h-40 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition text-slate-600">
                        <Server className="h-24 w-24" />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                          <Server className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded-sm border border-slate-200">
                          Secondary Node
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-blue-600 transition">
                          SCUCM
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Backup device and calling protocols set
                        </p>
                      </div>

                      <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Backup Registers</span>
                        <span className="font-mono text-slate-700 font-bold">{getSectionUserCount("SCUCM")} Users</span>
                      </div>
                    </div>

                    {/* CARD 4: CUCM UNITY */}
                    <div
                      id="section-card-cucmunity"
                      onClick={() => setActiveSection("CUCM_UNITY")}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 cursor-pointer transition flex flex-col justify-between h-40 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition text-violet-600">
                        <PhoneCall className="h-24 w-24" />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                          <PhoneCall className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] bg-violet-50 text-violet-700 font-extrabold px-1.5 py-0.5 rounded-sm">
                          Voice Mails
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-blue-600 transition">
                          CUCM UNITY
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Voice mails credentials and profile mapping
                        </p>
                      </div>

                      <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>VM Registry</span>
                        <span className="font-mono text-slate-700 font-bold">{getSectionUserCount("CUCM_UNITY")} Users</span>
                      </div>
                    </div>

                    {/* CARD 5: GCC CUCM */}
                    <div
                      id="section-card-gcccucm"
                      onClick={() => setActiveSection("GCC_CUCM")}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 cursor-pointer transition flex flex-col justify-between h-40 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition text-emerald-600">
                        <Server className="h-24 w-24" />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                          <Server className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-sm">
                          Global Stack
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-blue-600 transition">
                          GCC CUCM
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          GCC localized devices and profile channels
                        </p>
                      </div>

                      <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>GCC Stack</span>
                        <span className="font-mono text-slate-700 font-bold">{getSectionUserCount("GCC_CUCM")} Users</span>
                      </div>
                    </div>

                    {/* CARD 6: GCC CUCM UNITY */}
                    <div
                      id="section-card-gcccucmunity"
                      onClick={() => setActiveSection("GCC_CUCM_UNITY")}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 cursor-pointer transition flex flex-col justify-between h-40 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition text-teal-600">
                        <PhoneCall className="h-24 w-24" />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                          <PhoneCall className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] bg-teal-50 text-teal-700 font-extrabold px-1.5 py-0.5 rounded-sm">
                          GCC VM
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-blue-600 transition">
                          GCC CUCM UNITY
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          GCC voice mail credentials maps
                        </p>
                      </div>

                      <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>GCC VM system</span>
                        <span className="font-mono text-slate-700 font-bold">{getSectionUserCount("GCC_CUCM_UNITY")} Users</span>
                      </div>
                    </div>

                    {/* CARD 7: TANGOE */}
                    <div
                      id="section-card-tangoe"
                      onClick={() => setActiveSection("TANGOE")}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 cursor-pointer transition flex flex-col justify-between h-40 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition text-orange-600">
                        <Activity className="h-24 w-24" />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                          <Activity className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] bg-orange-50 text-orange-700 font-extrabold px-1.5 py-0.5 rounded-sm">
                          Wireless Devices
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-blue-600 transition">
                          TANGOE
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Assess wireless mobile interface directories
                        </p>
                      </div>

                      <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Tangoe System</span>
                        <span className="font-mono text-slate-700 font-bold">{getSectionUserCount("TANGOE")} Users</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Informative system guide card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 leading-relaxed flex gap-3.5 items-start">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Access Authorization Flow Instructions</h5>
                    <p className="text-slate-500 font-medium">
                      This directory synchronizes system states in real time. Registering or modifying a user in the{" "}
                      <strong className="text-blue-600 font-bold">Profile Section</strong> and checking-on target cluster services automatically populates those corresponding server panels. Clicking "Revoke Access" in any dedicated server cluster will instantly deselect that service mapping from the user's master record.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "Profile" && (
              <motion.div
                key="profile-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Profile Billboard */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Master Directory Controls
                    </h2>
                    <p className="text-xs text-slate-700 font-medium mt-1">
                      Manage system-wide staff, register identity tokens, assign corporate roles, and provision servers mapping boundaries.
                    </p>
                  </div>
                  <button
                    id="btn-profile-create-user"
                    onClick={() => {
                      setUserToEdit(null);
                      setIsModalOpen(true);
                    }}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 transition font-bold text-xs text-white px-4 py-2.5 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create Staff User
                  </button>
                </div>

                {/* Table User List component */}
                <UserTable
                  users={users}
                  onEditUser={handleEditRequest}
                  onDeleteUser={handleDeleteUser}
                />
              </motion.div>
            )}

            {activeSection !== "Hub" && activeSection !== "Profile" && (
              <motion.div
                key={`${activeSection}-layout`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <ServerSection
                  section={activeSection}
                  users={users}
                  onRevoke={handleRevokePermission}
                  tangoeRequests={tangoeRequests}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            N.A.M.S • Network Access Management System • Real-Time Core Synchronizer
          </p>
        </footer>
      </main>

      {/* Modal form */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUserToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        userToEdit={userToEdit}
        users={users}
      />

      {/* Tangoe Special Revocation Request Modal */}
      <AnimatePresence>
        {tangoeRevokeUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setTangoeRevokeUser(null);
                setTangoeDescription("");
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6 border border-slate-100 z-110"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-605 border border-amber-100">
                    <HelpCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                      Tangoe Revocation Request
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                      Create and route an external vendor action ticket
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTangoeRevokeUser(null);
                    setTangoeDescription("");
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleTangoeSubmit} className="space-y-4">
                <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5 mb-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                    Tangoe is a vendor-managed access cluster. Direct identity revocation is prohibited. Submitting this form raises an official action ticket to the Tangoe vendor desk immediately.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Employee Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={tangoeRevokeUser.name}
                      className="w-full rounded-xl bg-slate-50 border border-slate-150 py-2.5 px-3.5 text-xs font-semibold text-slate-500 focus:outline-hidden cursor-not-allowed select-all"
                    />
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={tangoeRevokeUser.employeeId}
                      className="w-full rounded-xl bg-slate-50 border border-slate-150 py-2.5 px-3.5 text-xs font-semibold text-slate-500 focus:outline-hidden cursor-not-allowed select-all font-mono"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Corporate Location
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={tangoeRevokeUser.location}
                    className="w-full rounded-xl bg-slate-50 border border-slate-150 py-2.5 px-3.5 text-xs font-semibold text-slate-500 focus:outline-hidden cursor-not-allowed select-all"
                  />
                </div>

                {/* Description / Reason */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                    Description / Reason for Revocation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={tangoeDescription}
                    onChange={(e) => setTangoeDescription(e.target.value)}
                    placeholder="e.g., Employee offboarding effective immediately. Revoke Tangoe wireless options. Route ticket to network provisioning queue."
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-slate-50/10 resize-none leading-relaxed"
                  />
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setTangoeRevokeUser(null);
                      setTangoeDescription("");
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 transition font-extrabold text-xs text-white px-5 py-2.5 inline-flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Vendor Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
