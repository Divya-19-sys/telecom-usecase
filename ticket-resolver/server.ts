import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_INCIDENTS } from './src/mockData';
import { Incident, IncidentStatus, WorkNote } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple in-memory storage initialized with hardcopy of initial incidents
  let incidentsData: Incident[] = [...INITIAL_INCIDENTS];

  // --- API ROUTES ---

  // 1. Get all incidents (optional ?state= filter)
  app.get('/api/incidents', (req, res) => {
    const { state } = req.query;
    let result = incidentsData;
    if (state && typeof state === 'string') {
      result = incidentsData.filter(inc => inc.status.toLowerCase() === state.toLowerCase());
    }
    res.json(result);
  });

  // 2. Create a new incident record
  app.post('/api/incidents', (req, res) => {
    const formData = req.body;
    
    // Auto-calculate the next incremental serial ID
    const defaultStart = 4815;
    const numericIds = incidentsData
      .map(inc => {
        const parsed = parseInt(inc.id.replace('INC', ''), 10);
        return isNaN(parsed) ? 0 : parsed;
      })
      .filter(num => num > 0);

    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : defaultStart;
    const newId = `INC${String(maxId + 1).padStart(7, '0')}`;
    const rightNow = new Date().toISOString();
    
    const initialNote: WorkNote = {
      id: `note-${Date.now()}`,
      content: `System generated: Incident ticket initialized manually via API. Initial allocated status: ${formData.status || 'Open'}.`,
      timestamp: rightNow,
      updatedBy: 'System Automator'
    };

    const newIncident: Incident = {
      id: newId,
      name: formData.name,
      employeeId: formData.employeeId,
      mailAddress: formData.mailAddress,
      roles: formData.roles || [],
      description: formData.description,
      status: formData.status || 'Open',
      createdAt: rightNow,
      lastUpdated: rightNow,
      workNotes: [initialNote]
    };

    incidentsData = [newIncident, ...incidentsData];
    res.status(201).json(newIncident);
  });

  // 3. Update status of an incident
  app.put('/api/incidents/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status: IncidentStatus };
    const rightNow = new Date().toISOString();
    
    let updatedIncident: Incident | null = null;
    
    incidentsData = incidentsData.map(inc => {
      if (inc.id === id) {
        const newNote: WorkNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          content: `Incident status transitioned manually on server to: ${status}.`,
          timestamp: rightNow,
          updatedBy: 'System Automator'
        };
        const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
        updatedIncident = {
          ...inc,
          status,
          lastUpdated: rightNow,
          workNotes: notes
        };
        return updatedIncident;
      }
      return inc;
    });

    if (updatedIncident) {
      res.json(updatedIncident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  // 4. Mark specific incident as Resolved
  app.put('/api/incidents/:id/resolve', (req, res) => {
    const { id } = req.params;
    const rightNow = new Date().toISOString();
    
    let updatedIncident: Incident | null = null;
    
    incidentsData = incidentsData.map(inc => {
      if (inc.id === id) {
        const newNote: WorkNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          content: `Incident marked as Resolved. Resolution confirmed via API.`,
          timestamp: rightNow,
          updatedBy: 'System Automator'
        };
        const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
        updatedIncident = {
          ...inc,
          status: 'Resolved',
          lastUpdated: rightNow,
          workNotes: notes
        };
        return updatedIncident;
      }
      return inc;
    });

    if (updatedIncident) {
      res.json(updatedIncident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  // 5. Close specific incident
  app.put('/api/incidents/:id/close', (req, res) => {
    const { id } = req.params;
    const rightNow = new Date().toISOString();
    
    let updatedIncident: Incident | null = null;
    
    incidentsData = incidentsData.map(inc => {
      if (inc.id === id) {
        const newNote: WorkNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          content: `Incident ticket formally Closed. Access tokens revoked via API.`,
          timestamp: rightNow,
          updatedBy: 'System Automator'
        };
        const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
        updatedIncident = {
          ...inc,
          status: 'Closed',
          lastUpdated: rightNow,
          workNotes: notes
        };
        return updatedIncident;
      }
      return inc;
    });

    if (updatedIncident) {
      res.json(updatedIncident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  // 6b. Update incident state and/or work notes (used by agent's update_ticket)
  app.patch('/api/incidents/:id', (req, res) => {
    const { id } = req.params;
    const { state, work_notes } = req.body;
    const rightNow = new Date().toISOString();

    let updatedIncident: Incident | null = null;

    incidentsData = incidentsData.map(inc => {
      if (inc.id === id) {
        const newNotes = inc.workNotes ? [...inc.workNotes] : [];
        if (work_notes) {
          newNotes.push({
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            content: work_notes,
            timestamp: rightNow,
            updatedBy: 'System Automator',
          });
        }
        updatedIncident = {
          ...inc,
          ...(state ? { status: state } : {}),
          lastUpdated: rightNow,
          workNotes: newNotes,
        };
        return updatedIncident;
      }
      return inc;
    });

    if (updatedIncident) {
      res.json(updatedIncident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  // 6c. Append dynamic custom work note log
  app.post('/api/incidents/:id/notes', (req, res) => {
    const { id } = req.params;
    const { content, updatedBy } = req.body;
    const rightNow = new Date().toISOString();
    
    let updatedIncident: Incident | null = null;
    
    incidentsData = incidentsData.map(inc => {
      if (inc.id === id) {
        const newNote: WorkNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          content,
          timestamp: rightNow,
          updatedBy: updatedBy || 'Divya D.'
        };
        const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
        updatedIncident = {
          ...inc,
          lastUpdated: rightNow,
          workNotes: notes
        };
        return updatedIncident;
      }
      return inc;
    });

    if (updatedIncident) {
      res.json(updatedIncident);
    } else {
      res.status(404).json({ error: 'Incident not found' });
    }
  });

  // --- VITE MIDDLEWARE CONFIGURATION ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Failed to launch server:', err);
});
