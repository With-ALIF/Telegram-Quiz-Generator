export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  photoURL?: string;
  createdAt?: { seconds: number };
  /** epoch seconds of the last sign-in (supabase auth), when provided by the API */
  lastActive?: number | null;
  stats?: {
    generated: number;
    sent: number;
  };
}

/** UI view-model used by the user management screen */
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  generated: number;
  sent: number;
  features: string[];
  /** epoch seconds */
  joinedAt: number | null;
  /** epoch seconds */
  lastActive: number | null;
}

export interface PageDefinition {
  id: string;
  name: string;
  path: string;
  icon?: any;
}
