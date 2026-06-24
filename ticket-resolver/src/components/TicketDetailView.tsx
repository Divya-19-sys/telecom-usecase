import React, { useState } from 'react';
import { Incident, IncidentStatus, INCIDENT_STATUSES, WorkNote } from '../types';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XSquare, 
  AlertCircle, 
  User, 
  Mail, 
  Calendar, 
  Plus, 
  Save, 
  Check, 
  MessageSquare,
  Building,
  UserCheck
} from 'lucide-react';

interface TicketDetailViewProps {
  incident: Incident;
  onUpdateStatus: (id: string, nextStatus: IncidentStatus) => void;
  onAddWorkNote: (id: string, content: string, updatedBy?: string) => void;
  onMarkAsResolved: (id: string) => void;
  onCloseIncident: (id: string) => void;
  onBackToList: () => void;
}

export function TicketDetailView({
  incident,
  onUpdateStatus,
  onAddWorkNote,
  onMarkAsResolved,
  onCloseIncident,
  onBackToList
}: TicketDetailViewProps) {
  const [noteContent, setNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Divya D.'); // Default to logged-in user

  // Helper to get status colors
  const getStatusConfig = (status: IncidentStatus) => {
    switch (status) {
      case 'Open':
        return {
          bg: 'bg-blue-50/60 border-blue-200/60 text-blue-800 backdrop-blur-xs',
          dot: 'bg-blue-500',
          text: 'Open',
          badgeColor: 'bg-blue-600 text-white'
        };
      case 'In Progress':
        return {
          bg: 'bg-orange-50/60 border-orange-200/60 text-orange-900 backdrop-blur-xs',
          dot: 'bg-orange-500',
          text: 'In Progress',
          badgeColor: 'bg-orange-500 text-white'
        };
      case 'On Hold':
        return {
          bg: 'bg-yellow-50/60 border-yellow-200/60 text-yellow-900 backdrop-blur-xs',
          dot: 'bg-yellow-500',
          text: 'On Hold',
          badgeColor: 'bg-amber-500 text-white'
        };
      case 'Resolved':
        return {
          bg: 'bg-green-50/60 border-green-200/60 text-green-900 backdrop-blur-xs',
          dot: 'bg-green-500',
          text: 'Resolved',
          badgeColor: 'bg-emerald-600 text-white'
        };
      case 'Closed':
        return {
          bg: 'bg-slate-100/60 border-slate-300/60 text-slate-800 backdrop-blur-xs',
          dot: 'bg-slate-500',
          text: 'Closed',
          badgeColor: 'bg-slate-600 text-white'
        };
    }
  };

  const statusConfig = getStatusConfig(incident.status);

  // Handle Note Submission
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    onAddWorkNote(incident.id, noteContent.trim(), noteAuthor.trim() || undefined);
    setNoteContent('');
  };

  // Helper to format timestamp inside notes timeline
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" id={`ticket-detail-view-page-${incident.id}`}>
      
      {/* Back Button Action Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-list"
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-lg transition-all shadow-xs hover:shadow-sm cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incident Pipeline
        </button>
        
        {/* Creation Date Badge */}
        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Logged: {new Date(incident.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Primary Detail Top Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 md:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs bg-[#005fb8] text-white px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              TICKET FILE
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono tracking-tight">
              {incident.id}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
            {incident.description}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Nominated Reporter: <span className="text-slate-200 font-bold">{incident.name}</span> ({incident.employeeId})
          </p>
        </div>

        {/* Current State Status Banner Box */}
        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">
            Operational Status
          </span>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-lg border uppercase shadow-xs ${statusConfig.bg}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.text}
            </span>
          </div>
          <span className="text-[9.5px] text-slate-450 font-mono block">
            Last updated: {new Date(incident.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Grid Workspace: Left (Specs / Demographics), Right (Activity log / notes + states) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Grid: Incident Specifications (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Reporter Demographics */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/40">
              <User className="h-4 w-4 text-[#005fb8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Reporter Demographics
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider font-mono">
                  Full Name
                </span>
                <span className="text-xs font-bold text-slate-900 block bg-white/70 p-2 rounded-md border border-slate-200/50 mt-1">
                  {incident.name}
                </span>
              </div>
              
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider font-mono">
                  Employee ID
                </span>
                <span className="text-xs font-mono font-medium text-slate-705 block bg-white/70 p-2 rounded-md border border-slate-200/50 mt-1">
                  {incident.employeeId}
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider font-mono">
                  Corporate Email
                </span>
                <a 
                  id={`mail-link-detail-${incident.id}`}
                  href={`mailto:${incident.mailAddress}`} 
                  className="text-xs text-[#005fb8] hover:underline flex items-center gap-1.5 font-medium bg-white/70 p-2 rounded-md border border-slate-200/50 mt-1"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {incident.mailAddress}
                </a>
              </div>

              <div className="md:col-span-2">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider font-mono mb-1">
                  Assigned Profile Roles
                </span>
                <div className="flex flex-wrap gap-1.5 bg-white/50 p-2 rounded-lg border border-slate-200/40">
                  {incident.roles.map((role, idx) => (
                    <span 
                      key={idx} 
                      className="text-[10px] bg-amber-50 border border-amber-250/50 text-amber-900 font-bold px-2 py-0.5 rounded"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Issue specifications and Logs */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/40">
              <MessageSquare className="h-4 w-4 text-[#005fb8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Issue Specifications
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider font-mono">
                  Description
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 bg-white/70 p-3 rounded-lg border border-slate-200/50 leading-relaxed font-mono select-text shadow-3xs">
                  {incident.description}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Grid: Core Controls & Activity Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Status Update and Command Buttons */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/40">
              <Building className="h-4 w-4 text-[#005fb8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Status Update & Actions
              </h3>
            </div>

            {/* Instant update selector */}
            <div className="space-y-2">
              <label htmlFor="detail-status-select" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Change Status
              </label>
              <select
                id="detail-status-select"
                value={incident.status}
                onChange={(e) => onUpdateStatus(incident.id, e.target.value as IncidentStatus)}
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20 cursor-pointer outline-hidden font-bold text-slate-800 shadow-5xs"
              >
                {INCIDENT_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Helper macro buttons */}
            <div className="space-y-2.5 pt-2">
              <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">
                Workflow Macros
              </span>
              
              <div className="grid grid-cols-2 gap-2.5">
                {/* Resolve Button */}
                <button
                  id="detail-btn-resolve"
                  type="button"
                  onClick={() => onMarkAsResolved(incident.id)}
                  disabled={incident.status === 'Resolved' || incident.status === 'Closed'}
                  className={`w-full py-2.5 px-3.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    incident.status === 'Resolved' || incident.status === 'Closed'
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                      : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 hover:shadow-sm active:scale-[0.98]'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Resolved
                </button>

                {/* Close Ticket Button */}
                <button
                  id="detail-btn-close"
                  type="button"
                  onClick={() => onCloseIncident(incident.id)}
                  disabled={incident.status === 'Closed'}
                  className={`w-full py-2.5 px-3.5 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    incident.status === 'Closed'
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                      : 'bg-slate-700 text-white border-slate-650 hover:bg-slate-800 hover:shadow-sm active:scale-[0.98]'
                  }`}
                >
                  <XSquare className="h-4 w-4" />
                  Close Ticket
                </button>
              </div>
            </div>
          </div>

          {/* Work Notes / Activity Log Section */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/60 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/40">
              <Clock className="h-4 w-4 text-[#005fb8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Work Notes & Activity
              </h3>
            </div>

            {/* Note form input */}
            <form onSubmit={handleNoteSubmit} className="space-y-3" id="add-worklog-note-form">
              <div>
                <label htmlFor="note-content-area" className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider font-mono mb-1.5">
                  Write Work Note
                </label>
                <textarea
                  id="note-content-area"
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Insert troubleshooting logs, resolution details, or diagnostic progress..."
                  className="w-full text-xs p-3 bg-white rounded-lg border border-slate-350 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20 outline-hidden tracking-normal leading-relaxed resize-none shadow-5xs"
                />
              </div>

              {/* Identity & Button Row */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                <div className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                  <input
                    id="note-author-input"
                    type="text"
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                    placeholder="Author name"
                    title="User documenting this note"
                    className="text-[11px] font-bold text-slate-700 p-1 bg-transparent max-w-[120px] outline-hidden border-b border-dashed border-slate-300 focus:border-[#005fb8]"
                  />
                </div>

                <button
                  id="btn-add-note-submit"
                  type="submit"
                  disabled={!noteContent.trim()}
                  className={`px-4 py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !noteContent.trim()
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-[#005fb8] text-white hover:bg-[#004f99] shadow-xs hover:shadow-sm'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Note
                </button>
              </div>
            </form>

            {/* Scrollable Timeline */}
            <div className="pt-2">
              <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono mb-3">
                Timeline History ({incident.workNotes?.length || 0})
              </span>

              {(!incident.workNotes || incident.workNotes.length === 0) ? (
                <div className="text-center p-6 bg-white/40 rounded-lg border border-dashed border-slate-205">
                  <p className="text-[11px] text-slate-500 font-medium">
                    No work records found. Log first activity node.
                  </p>
                </div>
              ) : (
                <div className="relative pl-4 space-y-4 max-h-[300px] overflow-y-auto pr-1 text-xs" id="detail-workflow-timeline">
                  {/* Vertical connector line */}
                  <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-200" />

                  {/* Render Notes chronologically (newest on top is typical for log streams, let's reverse to render newly added on top, or standard chron. Let's do newest on top for extremely clean responsive feeds, or as requested: "Display notes in timeline format") */}
                  {[...(incident.workNotes || [])].reverse().map((note) => {
                    const isSystem = note.updatedBy.includes('System');
                    return (
                      <div className="relative group" key={note.id} id={`timeline-note-${note.id}`}>
                        {/* Bullet point indicator */}
                        <div className={`absolute -left-[14.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${
                          isSystem ? 'bg-blue-500 border-blue-200' : 'bg-emerald-500 border-emerald-100'
                        }`} />
                        
                        <div className="bg-white/85 hover:bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-5xs transition-colors space-y-1">
                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-550 border-b border-dashed border-slate-150 pb-1">
                            <span className="font-bold flex items-center gap-1 text-slate-705">
                              <User className="h-3 w-3 inline text-[#005fb8]" />
                              {note.updatedBy}
                            </span>
                            <span className="font-mono text-slate-500">
                              [{formatTime(note.timestamp)}]
                            </span>
                          </div>

                          {/* Detail comment text */}
                          <p className="text-slate-805 leading-relaxed break-words text-xs font-mono select-text">
                            {note.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
