export type Role = 'citizen' | 'admin' | 'maintenance';

export type ReportStatus =
  | 'submitted'
  | 'under-review'
  | 'assigned'
  | 'in-progress'
  | 'repair-completed'
  | 'verified'
  | 'rejected'
  | 'duplicate';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  team?: {
    _id: string;
    name: string;
    area?: string;
  } | string;
  isActive: boolean;
  createdAt?: string;
}

export interface StatusHistoryItem {
  status: ReportStatus;
  by?: {
    _id: string;
    name: string;
  };
  note?: string;
  at: string;
}

export interface ReportImage {
  url: string;
  publicId?: string;
}

export interface Report {
  _id: string;
  complaintId: string;
  citizen: User | string;
  images: ReportImage[];
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  address: string;
  area: string;
  priority: Priority;
  complaintCount: number;
  upvotes: string[];
  duplicateOf?: Report | string;
  status: ReportStatus;
  statusHistory: StatusHistoryItem[];
  assignedTeam?: {
    _id: string;
    name: string;
    area?: string;
  } | string;
  assignedAt?: string;
  dueDate?: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt?: string;
  distanceMeters?: number;
}

export interface Repair {
  _id: string;
  report: Report | string;
  team: {
    _id: string;
    name: string;
    area?: string;
  } | string;
  submittedBy: User | string;
  beforeImages: ReportImage[];
  afterImages: ReportImage[];
  notes?: string;
  materialsUsed?: string;
  timeTakenHours?: number;
  completedAt: string;
  verification: {
    status: 'pending' | 'approved' | 'rejected';
    by?: User | string;
    remarks?: string;
    at?: string;
  };
  createdAt?: string;
}

export interface Team {
  _id: string;
  name: string;
  area: string;
  members: User[];
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  user: string;
  message: string;
  report?: Report | string;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  completedReports: number;
  overdueReports: number;
  byStatus: Record<ReportStatus, number>;
  byPriority: Record<Priority, number>;
  averageRepairHours: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  completedCount: number;
}

export interface Hotspot {
  _id: string;
  count: number;
  criticalCount: number;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  area: string;
  completedCount: number;
  averageHours: number;
  overdueCount: number;
  reworkRate: number;
}
