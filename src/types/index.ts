// ── Core domain types ────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  userId?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon: string;
  iconType: 'emoji' | 'image';
  members: Member[];
  createdAt: string;
  createdBy?: string;
  isArchived?: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  amount: number;
  description: string;
  category: string;
  paidBy: string;
  splitAmong: string[];
  date: string;
  receipt?: string;
  group?: string;
  isSettlement?: boolean;
  isContribution?: boolean;
  settlementFrom?: string;
  settlementTo?: string;
  method?: string;
  customCategoryName?: string;
  customCategoryIcon?: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ── Auth result types ────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  user?: User;
  needsVerification?: boolean;
  email?: string;
  message?: string;
}

export interface SignupResult {
  success?: boolean;
  user?: User;
  needsVerification?: boolean;
  email?: string;
  message?: string;
}

// ── Balance types ────────────────────────────────────────────────

export interface Balances {
  youOwe: number;
  youAreOwed: number;
  netBalance: number;
  totalExpenses?: number;
}

export interface DebtTransaction {
  from: string;
  to: string;
  amount: number;
}

export interface MinimizedTransactions {
  transactions: DebtTransaction[];
  originalCount: number;
  optimizedCount: number;
  savings: number;
}

// ── Settings ─────────────────────────────────────────────────────

export interface AppSettings {
  currency: string;
  isDark: boolean;
  emailAlertsEnabled: boolean;
}
