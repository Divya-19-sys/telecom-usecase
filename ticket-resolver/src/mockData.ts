import { Incident } from './types';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC0004812',
    name: 'Sarah Jenkins',
    employeeId: 'EMP8291',
    mailAddress: 'sarah.jenkins@enterprise.com',
    roles: ['Developer', 'IT Admin'],
    description: 'Unable to push core commits to remote main branch due to SSL handshake error',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    lastUpdated: new Date(Date.now() - 3600000 * 18).toISOString(),
    workNotes: [
      {
        id: 'note-01',
        content: 'System generated: Incident ticket logged successfully via corporate portal.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedBy: 'System Automator'
      },
      {
        id: 'note-02',
        content: 'Troubleshooting started: Checked active certificate keys on terminal. Handshake failure looks related to ZScaler root certificates.',
        timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
        updatedBy: 'Sarah Jenkins'
      },
      {
        id: 'note-03',
        content: 'Assigned ticket to Network Operations for profile permission audit.',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        updatedBy: 'IT Service desk'
      }
    ]
  },
  {
    id: 'INC0004813',
    name: 'David Vance',
    employeeId: 'EMP4491',
    mailAddress: 'david.vance@enterprise.com',
    roles: ['Tele Caller'],
    description: 'CRM telephony dialing module throwing sound drivers invalid exception',
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    lastUpdated: new Date(Date.now() - 3600000 * 4).toISOString(),
    workNotes: [
      {
        id: 'note-04',
        content: 'System generated: Telephony device connectivity ticket initialized.',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedBy: 'System Automator'
      }
    ]
  },
  {
    id: 'INC0004814',
    name: 'Amanda Ross',
    employeeId: 'EMP3012',
    mailAddress: 'amanda.ross@enterprise.com',
    roles: ['HR'],
    description: 'Workday HR payroll portal dashboard loading blank screen in browser',
    status: 'On Hold',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    lastUpdated: new Date(Date.now() - 3600000 * 10).toISOString(),
    workNotes: [
      {
        id: 'note-05',
        content: 'Portal login test performed. Confirmed credentials are valid, but the nested pay-structures API call triggers a 403 authorization breach.',
        timestamp: new Date(Date.now() - 3600000 * 11).toISOString(),
        updatedBy: 'Amanda Ross'
      },
      {
        id: 'note-06',
        content: 'Placed on Hold: Outsource vendor Workday Integration Services contacted to authorize scope parameters on payroll schemas.',
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
        updatedBy: 'IT Service desk'
      }
    ]
  },
  {
    id: 'INC0004816',
    name: 'Jane Smith',
    employeeId: '001',
    mailAddress: 'jane@ex.com',
    roles: ['Developer'],
    description: 'Please revoke access for Jane Smith from all servers as part of offboarding process.',
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(),
    workNotes: [
      {
        id: 'note-10',
        content: 'System generated: Access revocation ticket for offboarding.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedBy: 'System Automator'
      }
    ]
  },
  {
    id: 'INC0004815',
    name: 'Marcus Brody',
    employeeId: 'EMP9034',
    mailAddress: 'marcus.brody@enterprise.com',
    roles: ['Manager'],
    description: 'Weekly operations sprint calendar invitations duplicated in Microsoft Teams',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    lastUpdated: new Date(Date.now() - 3600000 * 20).toISOString(),
    workNotes: [
      {
        id: 'note-07',
        content: 'Duplicate calendar feeds detected for both MS Teams web app and desktop clients.',
        timestamp: new Date(Date.now() - 3600000 * 47).toISOString(),
        updatedBy: 'System Automator'
      },
      {
        id: 'note-08',
        content: 'Successfully ran MS Exchange mailbox synchronizer to purge calendar cache.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedBy: 'IT Team Core'
      },
      {
        id: 'note-09',
        content: 'Resolution verified: Duplicates successfully purged from all employee calendars.',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
        updatedBy: 'Marcus Brody'
      }
    ]
  }
];
