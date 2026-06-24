export type UserRole = 'Developer' | 'Manager' | 'Tele Caller' | 'HR' | 'IT Admin';

export type IncidentStatus = 'Open' | 'In Progress' | 'On Hold' | 'Resolved' | 'Closed';

export interface WorkNote {
  id: string;
  content: string;
  timestamp: string;
  updatedBy: string;
}

export interface Incident {
  id: string;
  name: string;
  employeeId: string;
  mailAddress: string;
  roles: UserRole[]; // Dropdown allows multi-select as requested
  description: string;
  status: IncidentStatus;
  createdAt: string;
  lastUpdated: string;
  workNotes: WorkNote[];
}

export const USER_ROLES: UserRole[] = [
  'Developer',
  'Manager',
  'Tele Caller',
  'HR',
  'IT Admin'
];

export const INCIDENT_STATUSES: IncidentStatus[] = [
  'Open',
  'In Progress',
  'On Hold',
  'Resolved',
  'Closed'
];
