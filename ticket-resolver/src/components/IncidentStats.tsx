import React from 'react';
import { Incident, IncidentStatus } from '../types';
import { AlertCircle, Clock, PauseCircle, CheckCircle, Archive, Kanban } from 'lucide-react';

interface IncidentStatsProps {
  incidents: Incident[];
  activeFilter: IncidentStatus | 'All';
  onFilterChange: (status: IncidentStatus | 'All') => void;
}

export function IncidentStats({ incidents, activeFilter, onFilterChange }: IncidentStatsProps) {
  const getCount = (status: IncidentStatus | 'All') => {
    if (status === 'All') return incidents.length;
    return incidents.filter(i => i.status === status).length;
  };

  const cards: {
    label: string;
    value: IncidentStatus | 'All';
    count: number;
    colorClass: string;
    borderColor: string;
    textColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      label: 'All Incidents',
      value: 'All',
      count: getCount('All'),
      colorClass: 'bg-white/60 hover:bg-white/90 border-white/65 backdrop-blur-md text-slate-800',
      borderColor: 'border-l-4 border-l-slate-500',
      textColor: 'text-slate-800',
      icon: <Kanban className="h-5 w-5 text-slate-500" />,
    },
    {
      label: 'Open',
      value: 'Open',
      count: getCount('Open'),
      colorClass: 'bg-blue-50/50 hover:bg-blue-100/75 border-blue-250/50 backdrop-blur-md text-blue-900',
      borderColor: 'border-l-4 border-l-sky-500',
      textColor: 'text-sky-800',
      icon: <AlertCircle className="h-5 w-5 text-sky-500" />,
    },
    {
      label: 'In Progress',
      value: 'In Progress',
      count: getCount('In Progress'),
      colorClass: 'bg-orange-50/50 hover:bg-orange-100/75 border-orange-200/50 backdrop-blur-md text-orange-950',
      borderColor: 'border-l-4 border-l-orange-500',
      textColor: 'text-orange-900',
      icon: <Clock className="h-5 w-5 text-orange-500" />,
    },
    {
      label: 'On Hold',
      value: 'On Hold',
      count: getCount('On Hold'),
      colorClass: 'bg-yellow-55/60 hover:bg-yellow-100/75 border-yellow-200/50 backdrop-blur-md text-yellow-950',
      borderColor: 'border-l-4 border-l-amber-500',
      textColor: 'text-amber-900',
      icon: <PauseCircle className="h-5 w-5 text-amber-500" />,
    },
    {
      label: 'Resolved',
      value: 'Resolved',
      count: getCount('Resolved'),
      colorClass: 'bg-emerald-50/50 hover:bg-emerald-100/75 border-emerald-250/50 backdrop-blur-md text-emerald-950',
      borderColor: 'border-l-4 border-l-emerald-500',
      textColor: 'text-emerald-800',
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    },
    {
      label: 'Closed',
      value: 'Closed',
      count: getCount('Closed'),
      colorClass: 'bg-slate-100/50 hover:bg-slate-200/75 border-slate-300/50 backdrop-blur-md text-slate-800',
      borderColor: 'border-l-4 border-l-slate-400',
      textColor: 'text-slate-650',
      icon: <Archive className="h-5 w-5 text-slate-450" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6" id="incident-stats-container">
      {cards.map((card) => {
        const isSelected = activeFilter === card.value;
        return (
          <button
            key={card.value}
            id={`stat-card-${card.value.toLowerCase().replace(' ', '-')}`}
            onClick={() => onFilterChange(card.value)}
            className={`transition-all duration-200 p-4 rounded-lg border text-left flex flex-col justify-between cursor-pointer relative shadow-xs overflow-hidden ${card.colorClass} ${card.borderColor} ${
              isSelected ? 'ring-2 ring-primary ring-offset-1 scale-[1.02]' : 'hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center justify-between gap-1 w-full text-slate-500">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 block truncate">{card.label}</span>
              <div className="shrink-0">{card.icon}</div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono ${card.textColor}`}>{card.count}</span>
              {isSelected && (
                <span className="text-[10px] font-semibold bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase font-mono shadow-xs">
                  Active Filter
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
