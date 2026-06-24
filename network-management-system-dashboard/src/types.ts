export type LocationType = "USA" | "Canada" | "India";

export interface TangoeRevokeRequest {
  id: string;
  userId: string;
  name: string;
  employeeId: string;
  location: LocationType;
  description: string;
  createdAt: string;
  status: "Pending Vendor Action" | "Completed" | "Sent to Tangoe Desk";
}

export type RoleType = "Developer" | "Manager" | "Tele Caller" | "HR" | "IT Admin";

export interface User {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  location: LocationType;
  roles: RoleType[];
  servers: string[];
  createdAt: string;
}

export type SectionType =
  | "Profile"
  | "PCUCM"
  | "SCUCM"
  | "CUCM_UNITY"
  | "GCC_CUCM"
  | "GCC_CUCM_UNITY"
  | "TANGOE";

export interface ServerConfig {
  id: SectionType;
  label: string;
  buttons: string[];
  // Mapping of button selection to internal server select strings
  buttonMapping: Record<string, string>;
}

export const SERVERS_CONFIG: Record<Exclude<SectionType, "Profile">, ServerConfig> = {
  PCUCM: {
    id: "PCUCM",
    label: "PCUCM",
    buttons: ["Device Profile", "Phone Profile", "Device & Phone Profile"],
    buttonMapping: {
      "Device Profile": "PCUCM (Device Profile)",
      "Phone Profile": "PCUCM (Phone Profile)",
      "Device & Phone Profile": "PCUCM (Phone + Device Profile)",
    },
  },
  SCUCM: {
    id: "SCUCM",
    label: "SCUCM",
    buttons: ["Device Profile", "Phone Profile", "Device & Phone Profile"],
    buttonMapping: {
      "Device Profile": "SCUCM (Device Profile)",
      "Phone Profile": "SCUCM (Phone Profile)",
      "Device & Phone Profile": "SCUCM (Phone + Device Profile)",
    },
  },
  CUCM_UNITY: {
    id: "CUCM_UNITY",
    label: "CUCM UNITY",
    buttons: ["Voice Mails"],
    buttonMapping: {
      "Voice Mails": "CUCM Unity",
    },
  },
  GCC_CUCM: {
    id: "GCC_CUCM",
    label: "GCC CUCM",
    buttons: ["Device Profile", "Phone Profile", "Device & Phone Profile"],
    buttonMapping: {
      "Device Profile": "GCC CUCM (Device Profile)",
      "Phone Profile": "GCC CUCM (Phone Profile)",
      "Device & Phone Profile": "GCC CUCM (Phone + Device Profile)",
    },
  },
  GCC_CUCM_UNITY: {
    id: "GCC_CUCM_UNITY",
    label: "GCC CUCM UNITY",
    buttons: ["Voice Mails"],
    buttonMapping: {
      "Voice Mails": "GCC Unity",
    },
  },
  TANGOE: {
    id: "TANGOE",
    label: "TANGOE",
    buttons: ["Wireless Devices"],
    buttonMapping: {
      "Wireless Devices": "Tangoe",
    },
  },
};

export const SERVER_OPTIONS = [
  "PCUCM (Device Profile)",
  "PCUCM (Phone Profile)",
  "PCUCM (Phone + Device Profile)",
  "SCUCM (Device Profile)",
  "SCUCM (Phone Profile)",
  "SCUCM (Phone + Device Profile)",
  "CUCM Unity",
  "GCC CUCM (Phone Profile)",
  "GCC CUCM (Device Profile)",
  "GCC CUCM (Phone + Device Profile)",
  "GCC Unity",
  "Tangoe",
];

export const ROLE_OPTIONS: RoleType[] = [
  "Developer",
  "Manager",
  "Tele Caller",
  "HR",
  "IT Admin",
];

export const LOCATION_OPTIONS: LocationType[] = [
  "USA",
  "Canada",
  "India",
];

export const LOCATION_SERVERS_MAP: Record<LocationType, string[]> = {
  USA: [
    "PCUCM (Device Profile)",
    "PCUCM (Phone Profile)",
    "CUCM Unity",
    "Tangoe",
  ],
  Canada: [
    "SCUCM (Device Profile)",
    "SCUCM (Phone Profile)",
    "CUCM Unity",
    "Tangoe",
  ],
  India: [
    "GCC CUCM (Device Profile)",
    "GCC CUCM (Phone Profile)",
    "GCC Unity",
    "Tangoe",
  ],
};
