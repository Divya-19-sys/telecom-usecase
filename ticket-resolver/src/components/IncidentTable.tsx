import React, { useState } from 'react';
import { Incident, IncidentStatus, INCIDENT_STATUSES, UserRole } from '../types';
import { 
  CheckCircle2, 
  XSquare, 
  Search, 
  FileText, 
  Mail, 
  X,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';

interface IncidentTableProps {
  incidents: Incident[];
  onUpdateStatus: (id: string, nextStatus: IncidentStatus) => void;
  onMarkAsResolved: (id: string) => void;
  onCloseIncident: (id: string) => void;
  activeFilter: IncidentStatus | 'All';
  onFilterChange: (status: IncidentStatus | 'All') => void;
  onRowClick: (id: string) => void;
}

export function IncidentTable({
  incidents,
  onUpdateStatus,
  onMarkAsResolved,
  onCloseIncident,
  activeFilter,
  onFilterChange,
  onRowClick
}: IncidentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Status Badge styling helper matching the requested colors
  const getStatusStyle = (status: IncidentStatus) => {
    switch (status) {
      case 'Open':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/80 transition-colors',
          dot: 'bg-blue-500',
          text: 'Open'
        };
      case 'In Progress':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-850 hover:bg-orange-100/80 transition-colors',
          dot: 'bg-orange-500',
          text: 'In Progress'
        };
      case 'On Hold':
        return {
          bg: 'bg-amber-50 border-amber-250 text-amber-900 hover:bg-amber-100/80 transition-colors',
          dot: 'bg-amber-500',
          text: 'On Hold'
        };
      case 'Resolved':
        return {
          bg: 'bg-green-50 border-green-250 text-green-900 hover:bg-green-100/80 transition-colors',
          dot: 'bg-green-500',
          text: 'Resolved'
        };
      case 'Closed':
        return {
          bg: 'bg-slate-100 border-slate-350 text-slate-800 hover:bg-slate-200/80 transition-colors',
          dot: 'bg-slate-500',
          text: 'Closed'
        };
    }
  };

  // Filter and search incidents
  const filteredIncidents = incidents.filter((incident) => {
    const matchesFilter = activeFilter === 'All' || incident.status === activeFilter;
    const cleanSearch = searchTerm.toLowerCase().trim();
    const matchesSearch =
      cleanSearch === '' ||
      incident.id.toLowerCase().includes(cleanSearch) ||
      incident.name.toLowerCase().includes(cleanSearch) ||
      incident.employeeId.toLowerCase().includes(cleanSearch) ||
      incident.description.toLowerCase().includes(cleanSearch) ||
      incident.mailAddress.toLowerCase().includes(cleanSearch) ||
      incident.roles.some((role) => role.toLowerCase().includes(cleanSearch));

    return matchesFilter && matchesSearch;
  });

  // Format Helper for timestamps
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div id="service-now-table-container" className="glass-panel overflow-hidden shadow-md rounded-xl">
      
      {/* Search & Filter Header bar */}
      <div className="p-4 bg-white/40 border-b border-white/40 flex flex-col sm:flex-row gap-3 items-center justify-between backdrop-blur-xs">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="table-search-input"
            type="text"
            placeholder="Search ID, name, employee, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 bg-white/70 backdrop-blur-xs rounded-lg border border-slate-300/60 outline-hidden focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20"
          />
          {searchTerm && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-650"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Filters and Count statistics */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto justify-end">
          <span className="text-xs font-semibold text-slate-600 shrink-0">
            Showing {filteredIncidents.length} of {incidents.length} incidents
          </span>
          {activeFilter !== 'All' && (
            <button
              id="btn-reset-filters"
              onClick={() => onFilterChange('All')}
              className="text-[11px] font-bold text-[#005fb8] bg-blue-50/70 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table grid area */}
      <div className="overflow-x-auto">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center" id="empty-table-state">
            <div className="bg-white/40 border border-white/60 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No active incidents match</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Try adjustment of search filters or review incident criteria on system. New incidents can be logged via key operations.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left" id="incident-records-table">
            {/* Table Column headers - customized exactly as requested */}
            <thead className="bg-[#293e40] text-slate-100 uppercase tracking-wider text-[11px] font-mono select-none">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 min-w-[200px]">Short Description</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Last Updated Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            
            {/* Table Rows */}
            <tbody className="divide-y divide-slate-150">
              {filteredIncidents.map((incident) => {
                const statusProps = getStatusStyle(incident.status);
                
                return (
                  <tr 
                    key={incident.id} 
                    id={`row-${incident.id}`}
                    onClick={() => onRowClick(incident.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-[#005fb8] group"
                    title="Click to open Ticket Detail View Page"
                  >
                    {/* Incident ID Link */}
                    <td className="py-3.5 px-4 font-bold text-sky-800 tracking-tight whitespace-nowrap">
                      <button
                        id={`link-${incident.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(incident.id);
                        }}
                        className="hover:underline text-left cursor-pointer font-mono inline-flex items-center gap-1 group-hover:text-[#005fb8]"
                      >
                        {incident.id}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Name / Contact details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 leading-tight">{incident.name}</div>
                      <div className="text-[10px] text-slate-450 font-mono block truncate max-w-[140px] mt-0.5">{incident.mailAddress}</div>
                    </td>

                    {/* Roles list */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {incident.roles.map((r, i) => (
                          <span 
                            key={r + i} 
                            className="bg-amber-50 border border-amber-250/50 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <div className="text-[#0f172a] font-medium leading-relaxed line-clamp-1 pr-2 w-full max-w-[300px]" title={incident.description}>
                        {incident.description}
                      </div>
                    </td>

                    {/* Incident Status Badge + inline selector combo */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1.5 items-center justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full border shadow-5xs ${statusProps.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusProps.dot}`} />
                          {statusProps.text}
                        </span>

                        {/* INLINE QUICK STATUS SELECTOR */}
                        <select
                          id={`status-select-${incident.id}`}
                          value={incident.status}
                          onChange={(e) => onUpdateStatus(incident.id, e.target.value as IncidentStatus)}
                          className="text-[9.5px] bg-white border border-slate-350 rounded font-bold text-slate-700 px-1 py-0.5 max-w-[110px] cursor-pointer hover:border-slate-450 outline-hidden"
                        >
                          {INCIDENT_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Last Updated Time */}
                    <td className="py-3.5 px-4 text-slate-650 font-mono text-[10.5px]">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatTime(incident.lastUpdated || incident.createdAt)}</span>
                      </div>
                    </td>

                    {/* Quick action buttons (inline workflow transitions) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* MARK AS RESOLVED */}
                        <button
                          id={`action-resolve-${incident.id}`}
                          onClick={() => onMarkAsResolved(incident.id)}
                          disabled={incident.status === 'Resolved' || incident.status === 'Closed'}
                          title="Mark as Resolved"
                          className={`p-1.5 rounded-md border transition-all text-xs font-bold leading-none ${
                            incident.status === 'Resolved' || incident.status === 'Closed'
                              ? 'bg-slate-50 text-slate-450 border-slate-100 cursor-not-allowed opacity-50'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-250 hover:bg-emerald-100/70 cursor-pointer active:scale-95'
                          }`}
                        >
                          <span className="hidden sm:inline sm:mr-1">Resolve</span>
                          <CheckCircle2 className="h-4 w-4 inline-block text-emerald-700" />
                        </button>

                        {/* CLOSE INCIDENT */}
                        <button
                          id={`action-close-${incident.id}`}
                          onClick={() => onCloseIncident(incident.id)}
                          disabled={incident.status === 'Closed'}
                          title="Close Incident"
                          className={`p-1.5 rounded-md border transition-all text-xs font-bold leading-none ${
                            incident.status === 'Closed'
                              ? 'bg-slate-50 text-slate-450 border-slate-100 cursor-not-allowed opacity-50'
                              : 'bg-slate-100 text-slate-705 border-slate-300 hover:bg-slate-205 cursor-pointer active:scale-95'
                          }`}
                        >
                          <span className="hidden sm:inline sm:mr-1">Close</span>
                          <XSquare className="h-4 w-4 inline-block text-slate-600" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
