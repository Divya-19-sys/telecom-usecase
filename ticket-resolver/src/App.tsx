import React, { useState, useEffect } from 'react';
import { Incident, IncidentStatus, WorkNote } from './types';
import { INITIAL_INCIDENTS } from './mockData';
import { IncidentStats } from './components/IncidentStats';
import { IncidentForm } from './components/IncidentForm';
import { IncidentTable } from './components/IncidentTable';
import { TicketDetailView } from './components/TicketDetailView';
import { 
  Plus, 
  LifeBuoy, 
  Database, 
  User, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<IncidentStatus | 'All'>('All');
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'fallback'>('connecting');

  // 1. Fetch incidents from API on initial page boot
  useEffect(() => {
    async function loadIncidents() {
      try {
        const res = await fetch('/api/incidents');
        if (!res.ok) throw new Error('API server returned response error');
        const data = await res.json();
        setIncidents(data);
        setApiStatus('connected');
      } catch (err) {
        console.warn('API server unreachable, fallback to local storage database:', err);
        const stored = localStorage.getItem('servicenow_incidents');
        if (stored) {
          try {
            setIncidents(JSON.parse(stored));
          } catch (e) {
            setIncidents(INITIAL_INCIDENTS);
          }
        } else {
          setIncidents(INITIAL_INCIDENTS);
          localStorage.setItem('servicenow_incidents', JSON.stringify(INITIAL_INCIDENTS));
        }
        setApiStatus('fallback');
      } finally {
        setIsLoading(false);
      }
    }
    loadIncidents();
  }, []);

  // 2. Refresh local timer clock in the header
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Helper to write back all changes securely (offline fallback)
  const saveToStorage = (updatedList: Incident[]) => {
    setIncidents(updatedList);
    localStorage.setItem('servicenow_incidents', JSON.stringify(updatedList));
  };

  // 4. Generate unique incremental ID
  const generateNewId = (currentList: Incident[]): string => {
    const defaultStart = 4815;
    const numericIds = currentList
      .map(inc => {
        const parsed = parseInt(inc.id.replace('INC', ''), 10);
        return isNaN(parsed) ? 0 : parsed;
      })
      .filter(num => num > 0);

    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : defaultStart;
    return `INC${String(maxId + 1).padStart(7, '0')}`;
  };

  // 5. Submit callback to create incident via API
  const handleAddIncident = async (formData: Omit<Incident, 'id' | 'createdAt' | 'lastUpdated' | 'workNotes'>) => {
    const rightNow = new Date().toISOString();
    const newId = generateNewId(incidents);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to create ticket on server');
      const newIncident = await res.json();
      
      const updated = [newIncident, ...incidents];
      setIncidents(updated);
      localStorage.setItem('servicenow_incidents', JSON.stringify(updated));
      
      setSelectedIncidentId(newIncident.id);
      setView('detail');
    } catch (err) {
      console.error('API create ticket failure, applying offline fallback:', err);
      const initialNote: WorkNote = {
        id: `note-${Date.now()}`,
        content: `Offline system entry: Incident ticket initialized locally. Initial allocated status: ${formData.status}.`,
        timestamp: rightNow,
        updatedBy: 'System Automator'
      };
      const newIncident: Incident = {
        ...formData,
        id: newId,
        createdAt: rightNow,
        lastUpdated: rightNow,
        workNotes: [initialNote]
      };
      const updated = [newIncident, ...incidents];
      saveToStorage(updated);
      setSelectedIncidentId(newId);
      setView('detail');
    }
  };

  // 6. Action: Update status via API
  const handleUpdateStatus = async (id: string, nextStatus: IncidentStatus) => {
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Status transition API request unsuccessful');
      const updatedIncident = await res.json();
      
      const updated = incidents.map(inc => inc.id === id ? updatedIncident : inc);
      setIncidents(updated);
      localStorage.setItem('servicenow_incidents', JSON.stringify(updated));
    } catch (err) {
      console.error('Offline fallback for status transition applied:', err);
      const rightNow = new Date().toISOString();
      const updated = incidents.map(inc => {
        if (inc.id === id) {
          const newNote: WorkNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            content: `Offline transition: Incident status updated to: ${nextStatus}.`,
            timestamp: rightNow,
            updatedBy: 'System Automator'
          };
          const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
          return { 
            ...inc, 
            status: nextStatus,
            lastUpdated: rightNow,
            workNotes: notes 
          };
        }
        return inc;
      });
      saveToStorage(updated);
    }
  };

  // 7. Action: Mark as Resolved on inline click via API
  const handleMarkAsResolved = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/resolve`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Resolve API request unsuccessful');
      const updatedIncident = await res.json();
      
      const updated = incidents.map(inc => inc.id === id ? updatedIncident : inc);
      setIncidents(updated);
      localStorage.setItem('servicenow_incidents', JSON.stringify(updated));
    } catch (err) {
      console.error('Offline fallback for close ticket applied:', err);
      const rightNow = new Date().toISOString();
      const updated = incidents.map(inc => {
        if (inc.id === id) {
          const newNote: WorkNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            content: `Offline resolution confirmed.`,
            timestamp: rightNow,
            updatedBy: 'System Automator'
          };
          const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
          return { 
            ...inc, 
            status: 'Resolved' as IncidentStatus,
            lastUpdated: rightNow,
            workNotes: notes
          };
        }
        return inc;
      });
      saveToStorage(updated);
    }
  };

  // 8. Action: Close Incident on inline click via API
  const handleCloseIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/close`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Close API request unsuccessful');
      const updatedIncident = await res.json();
      
      const updated = incidents.map(inc => inc.id === id ? updatedIncident : inc);
      setIncidents(updated);
      localStorage.setItem('servicenow_incidents', JSON.stringify(updated));
    } catch (err) {
      console.error('Offline fallback for close ticket applied:', err);
      const rightNow = new Date().toISOString();
      const updated = incidents.map(inc => {
        if (inc.id === id) {
          const newNote: WorkNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            content: `Offline close ticker logs recorded.`,
            timestamp: rightNow,
            updatedBy: 'System Automator'
          };
          const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
          return { 
            ...inc, 
            status: 'Closed' as IncidentStatus,
            lastUpdated: rightNow,
            workNotes: notes
          };
        }
        return inc;
      });
      saveToStorage(updated);
    }
  };

  // 9. Action: Add manual work note to ticket via API
  const handleAddWorkNote = async (id: string, content: string, updatedBy?: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, updatedBy: updatedBy || 'Divya D.' })
      });
      if (!res.ok) throw new Error('Work note API request unsuccessful');
      const updatedIncident = await res.json();
      
      const updated = incidents.map(inc => inc.id === id ? updatedIncident : inc);
      setIncidents(updated);
      localStorage.setItem('servicenow_incidents', JSON.stringify(updated));
    } catch (err) {
      console.error('Offline fallback for dynamic work note log applied:', err);
      const rightNow = new Date().toISOString();
      const updated = incidents.map(inc => {
        if (inc.id === id) {
          const newNote: WorkNote = {
            id: `note-${Date.now()}`,
            content: content,
            timestamp: rightNow,
            updatedBy: updatedBy || 'Divya D.'
          };
          const notes = inc.workNotes ? [...inc.workNotes, newNote] : [newNote];
          return {
            ...inc,
            lastUpdated: rightNow,
            workNotes: notes
          };
        }
        return inc;
      });
      saveToStorage(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/20 flex flex-col font-sans antialiased text-[#0f172a]">
      
      {/* Official Look Navigation Banner */}
      <header className="glass-header text-white border-b border-white/20 shadow-md h-14 shrink-0 px-4 md:px-6 flex items-center justify-between select-none">
        
        {/* Left: Classic Logo Brand - Ticket resolver */}
        <div className="flex items-center gap-3">
          <div className="bg-[#005fb8] text-white font-black px-2.5 py-1 rounded text-sm tracking-tight flex items-center justify-center font-mono shadow-xs uppercase">
            TR
          </div>
          <div className="h-6 w-px bg-white/25 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="font-bold text-sm tracking-wide bg-linear-to-r from-sky-450 to-white bg-clip-text text-transparent uppercase">
              Ticket resolver
            </span>
            <span className="text-[10px] text-slate-300 font-bold block leading-none font-mono tracking-tighter uppercase">
              INCIDENT HANDLING WORKSPACE
            </span>
          </div>
        </div>

        {/* Center: Live UTC Server Clock */}
        <div className="hidden md:flex items-center gap-2 text-slate-205 text-xs font-mono font-medium">
          <Clock className="h-3.5 w-3.5 text-slate-205" />
          <span>Server UTC Time:</span>
          <span className="text-white bg-black/35 px-2 py-0.5 rounded border border-white/15">
            {currentTime.substring(0, 19).replace('T', ' ')}
          </span>
        </div>

        {/* Right: Personal Logged-in profile banner */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden lg:block">
            <span className="text-xs font-bold text-slate-20 block">Divya D.</span>
            <span className="text-[10px] text-slate-350 font-mono font-bold block">divyad19092004@gmail.com</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-[#005fb8]/50 flex items-center justify-center text-white font-bold text-xs ring-2 ring-[#005fb8]/20">
            DD
          </div>
        </div>
      </header>

      {/* Primary Container Wrap */}
      <main className="grow p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Module Title / Quick Action button row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/40">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900" id="main-app-brand-title">
                {view === 'detail' ? 'Ticket Detail View' : 'Ticket resolver Dashboard'}
              </h1>
              <span className="bg-blue-100/70 text-blue-900 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-200/50 uppercase tracking-wide">
                Production-Active
              </span>
            </div>
            <p className="text-xs text-slate-650 mt-1">
              Analyze corporate network logs, ticket requests, and update support pipelines dynamically.
            </p>
          </div>

          {/* New Ticket Trigger button */}
          <button
            id="btn-trigger-create-incident"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#005fb8] hover:bg-[#004f99] active:scale-[0.98] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer font-sans"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Incident Record
          </button>
        </div>

        {/* Dual Screen View Router */}
        {view === 'detail' && selectedIncidentId ? (
          (() => {
            const selectedIncident = incidents.find(i => i.id === selectedIncidentId);
            if (!selectedIncident) {
              setView('list');
              return null;
            }
            return (
              <TicketDetailView
                incident={selectedIncident}
                onUpdateStatus={handleUpdateStatus}
                onAddWorkNote={handleAddWorkNote}
                onMarkAsResolved={handleMarkAsResolved}
                onCloseIncident={handleCloseIncident}
                onBackToList={() => setView('list')}
              />
            );
          })()
        ) : (
          <>
            {/* Section 1: Dynamic Metrics Cross-Filtering Cards */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Database className="h-4 w-4 text-slate-400" />
                <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 font-mono">
                  System Wide Operations Monitor
                </h2>
              </div>
              <IncidentStats 
                incidents={incidents} 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
              />
            </div>

            {/* Section 2: Table Records Grid Layout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-slate-400" />
                  <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 font-mono">
                    Incident Master Ledger {activeFilter !== 'All' ? `[Filtered: ${activeFilter}]` : ''}
                  </h2>
                </div>
                {activeFilter !== 'All' && (
                  <span className="text-[10px] bg-slate-100 font-semibold border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-700 font-mono">
                    Click "All Incidents" card or reset to clear filters
                  </span>
                )}
              </div>
              
              <IncidentTable 
                incidents={incidents}
                onUpdateStatus={handleUpdateStatus}
                onMarkAsResolved={handleMarkAsResolved}
                onCloseIncident={handleCloseIncident}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onRowClick={(id) => {
                  setSelectedIncidentId(id);
                  setView('detail');
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* Modal Dialog Overlay Form */}
      <IncidentForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleAddIncident} 
      />

      {/* Enterprise Status Footer Bar */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-[11px] py-4 px-6 shrink-0 mt-8 font-mono select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-slate-450">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Secure Enterprise SSL Node Active | Ticket resolver</span>
            {apiStatus === 'connected' && (
              <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-tight">
                <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" /> Express API Live
              </span>
            )}
            {apiStatus === 'connecting' && (
              <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.2 rounded bg-slate-500/10 text-slate-400 text-[10px] font-bold border border-slate-500/20 animate-pulse uppercase tracking-tight">
                <span className="h-1 w-1 bg-slate-400 rounded-full" /> Tunnelling Node...
              </span>
            )}
            {apiStatus === 'fallback' && (
              <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 uppercase tracking-tight">
                <span className="h-1 w-1 bg-amber-500 rounded-full" /> Cache Fallback
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Client ID: <strong className="text-white">DD-19092004</strong></span>
            <span className="hidden sm:inline">|</span>
            <span className="hover:text-white transition-colors cursor-help flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> helpdesk@ticketresolver.enterprise.com
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
