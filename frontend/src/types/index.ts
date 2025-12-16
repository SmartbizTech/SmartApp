export type UserRole = 'SUPER_ADMIN' | 'CA_ADMIN' | 'CA_STAFF' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  firmId: string | null;
  clientId: string | null;
  firmName: string | null;
  canViewClients?: boolean;
  canEditClients?: boolean;
  canAccessDocuments?: boolean;
  canAccessTasks?: boolean;
  canAccessCalendar?: boolean;
  canAccessChat?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Client {
  id: string;
  displayName: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  pan?: string;
  gstin?: string;
  cin?: string;
  createdAt: string;
  primaryUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export type DocumentStatus = 'REQUESTED' | 'UPLOADED' | 'REVIEWED' | 'APPROVED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'FILED' | 'APPROVED';
export type NotificationType = 'DEADLINE_REMINDER' | 'DOCUMENT_UPLOADED' | 'FILING_COMPLETED';

export interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  status: DocumentStatus;
  uploadedAt: string;
  folderId: string;
  versionNumber: number;
  clientId?: string;
  client?: {
    id: string;
    displayName: string;
  };
}

export interface ComplianceTask {
  id: string;
  complianceType: {
    code: string;
    displayName: string;
  };
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: TaskStatus;
  client: {
    id: string;
    displayName: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
}

export interface Notification {
  id: string;
  type: NotificationType;
  payload?: any;
  readAt?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  source: 'SYSTEM' | 'MANUAL';
  clientId?: string;
  client?: {
    id: string;
    displayName: string;
  };
}

// Admin panel types
export interface AdminFirm {
  id: string;
  name: string;
  gstin?: string;
  createdAt: string;
  users: {
    id: string;
    name: string;
    email: string;
    role: 'CA_ADMIN';
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  createdAt: string;
  canViewClients: boolean;
  canEditClients: boolean;
  canAccessDocuments: boolean;
  canAccessTasks: boolean;
  canAccessCalendar: boolean;
  canAccessChat: boolean;
}

export interface DocumentFolder {
  id: string;
  clientId: string;
  financialYear: string;
  name: string;
  parentFolderId?: string | null;
}

export interface ComplianceType {
  id: string;
  code: string;
  displayName: string;
}

