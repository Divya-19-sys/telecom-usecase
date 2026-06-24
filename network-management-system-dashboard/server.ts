import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface User {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  location: "USA" | "Canada" | "India";
  roles: string[];
  servers: string[];
  createdAt: string;
}

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

const USERS_FILE_PATH = path.join(process.cwd(), "users.json");

function loadUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const content = fs.readFileSync(USERS_FILE_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to read user file storage:", error);
  }
  saveUsers(INITIAL_SEED_USERS);
  return [...INITIAL_SEED_USERS];
}

function saveUsers(users: User[]) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write to user file storage:", error);
  }
}

let usersStore: User[] = loadUsers();

async function startServer() {
  const app = express();
  const PORT = 3001;

  // Body parser for JSON
  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Get all users
  app.get("/api/users", (req, res) => {
    res.json(usersStore);
  });

  // API Route: Register / Create new user
  app.post("/api/users", (req, res) => {
    const { name, employeeId, email, location, roles, servers } = req.body;
    
    if (!name || !employeeId || !email || !location) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      employeeId,
      email,
      location,
      roles: roles || [],
      servers: servers || [],
      createdAt: new Date().toISOString(),
    };

    usersStore = [newUser, ...usersStore];
    saveUsers(usersStore);
    res.status(201).json(newUser);
  });

  // API Route: Edit / Update existing user
  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { name, employeeId, email, location, roles, servers } = req.body;

    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updatedUser = {
      ...usersStore[index],
      name: name !== undefined ? name : usersStore[index].name,
      employeeId: employeeId !== undefined ? employeeId : usersStore[index].employeeId,
      email: email !== undefined ? email : usersStore[index].email,
      location: location !== undefined ? location : usersStore[index].location,
      roles: roles !== undefined ? roles : usersStore[index].roles,
      servers: servers !== undefined ? servers : usersStore[index].servers,
    };

    usersStore[index] = updatedUser;
    saveUsers(usersStore);
    res.json(updatedUser);
  });

  // API Route: Get single user by ID
  app.get("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const target = usersStore.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(target);
  });

  // API Route: Delete user
  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const target = usersStore.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    usersStore = usersStore.filter((u) => u.id !== id);
    saveUsers(usersStore);
    res.json({ success: true, message: `Deleted ${target.name}` });
  });

  // API Route: Submit a revocation request (for Tangoe - no direct revoke)
  app.post("/api/users/:id/revocation-request", (req, res) => {
    const { id } = req.params;
    const { server } = req.body;

    const target = usersStore.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log(`[Revocation Request] User ${target.name} - Server: ${server}`);
    res.status(201).json({ status: "success", message: `Revocation request submitted for ${server}. Awaiting processing.` });
  });

  // API Route: Revoke specific server permission from a user
  app.post("/api/users/:id/revoke", (req, res) => {
    const { id } = req.params;
    const { server } = req.body;

    if (!server) {
      res.status(400).json({ error: "Server option parameter required" });
      return;
    }

    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    usersStore[index] = {
      ...usersStore[index],
      servers: usersStore[index].servers.filter((s) => s !== server),
    };

    saveUsers(usersStore);
    res.json(usersStore[index]);
  });

  // Vite middleware for development vs static asset delivery for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Dynamic transform router to prevent blank pages on refreshes/navigation under Vite dev middleware
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api/")) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
