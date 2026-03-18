import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ApiService from '../api/apiService';
import StorageService from '../services/storageService';
import { currencies, DEFAULT_CURRENCY } from '../constants/currencies';
import type { Group, Expense, Notification, Member, User } from '../types';

// ── Helpers ───────────────────────────────────────────────────────

function makeId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Context type ──────────────────────────────────────────────────

interface AppContextValue {
  groups:        Group[];
  expenses:      Expense[];
  notifications: Notification[];
  isSyncing:     boolean;

  // Group actions
  createGroup:   (data: Omit<Group, 'id' | 'createdAt'>) => Promise<Group>;
  updateGroup:   (id: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup:   (id: string) => Promise<void>;
  addMember:     (groupId: string, member: Member) => Promise<void>;
  removeMember:  (groupId: string, memberId: string) => Promise<void>;
  archiveGroup:  (groupId: string, archived: boolean) => Promise<void>;

  // Expense actions
  addExpense:         (data: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense:      (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense:      (id: string) => Promise<void>;
  settleDebt:         (from: string, to: string, amount: number, method: string, groupId: string) => Promise<Expense>;
  recordContribution: (memberId: string, memberName: string, amount: number, groupId: string) => Promise<Expense>;

  // Notification actions
  addNotification:   (type: string, message: string) => void;
  markNotifRead:     (id: string) => void;
  markAllNotifsRead: () => void;
  unreadCount:       number;

  // Sync
  syncAll: (user: User) => Promise<void>;

  // Settings
  currency:             string;
  currencySymbol:       string;
  setCurrency:          (code: string) => void;
  isDark:               boolean;
  toggleTheme:          () => void;
  emailAlertsEnabled:   boolean;
  setEmailAlerts:       (val: boolean) => void;

  // Formatting
  fmt: (amount: number) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [groups,        setGroups]        = useState<Group[]>([]);
  const [expenses,      setExpenses]      = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSyncing,     setIsSyncing]     = useState(false);
  const [currency,      setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [isDark,        setIsDark]        = useState(true);
  const [emailAlerts,   setEmailAlertsState] = useState(true);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      const [g, e, n, cur, dark, ea] = await Promise.all([
        StorageService.getGroups(),
        StorageService.getExpenses(),
        StorageService.getNotifications(),
        StorageService.getSetting<string>('currency', DEFAULT_CURRENCY),
        StorageService.getSetting<boolean>('isDark', true),
        StorageService.getSetting<boolean>('emailAlerts', true),
      ]);
      setGroups(g);
      setExpenses(e);
      setNotifications(n);
      setCurrencyState(cur);
      setIsDark(dark);
      setEmailAlertsState(ea);
    })();
  }, []);

  const currencySymbol = currencies[currency]?.symbol ?? '₨';
  const fmt = useCallback((amount: number) => currencySymbol + new Intl.NumberFormat('en-IN').format(Math.round((amount || 0) * 100) / 100), [currencySymbol]);

  // ── Sync ────────────────────────────────────────────────────────

  const syncAll = useCallback(async (user: User) => {
    setIsSyncing(true);
    try {
      const sync = await ApiService.syncAll();
      const g = sync.groups || [];
      const e = sync.expenses || [];
      const n = sync.notifications || [];
      setGroups(g); setExpenses(e); setNotifications(n);
      await StorageService.saveGroups(g);
      await StorageService.saveExpenses(e);
      await StorageService.saveNotifications(n);
    } catch (err) {
      console.warn('[Sync] Backend unreachable, using local data');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ── Group actions ────────────────────────────────────────────────

  const createGroup = useCallback(async (data: Omit<Group, 'id' | 'createdAt'>): Promise<Group> => {
    const newGroup: Group = { ...data, id: makeId('g'), createdAt: new Date().toISOString() };
    const updated = [...groups, newGroup];
    setGroups(updated);
    await StorageService.saveGroups(updated);
    ApiService.createGroup(newGroup).then(res => {
      if (res?.group?._id || res?._id) {
        const serverId = res.group?._id ?? res._id;
        setGroups(prev => prev.map(g => g.id === newGroup.id ? { ...g, id: serverId } : g));
      }
    }).catch(e => console.warn('[Group] Create sync failed:', e.message));
    return newGroup;
  }, [groups]);

  const updateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    const updated = groups.map(g => g.id === id ? { ...g, ...updates } : g);
    setGroups(updated);
    await StorageService.saveGroups(updated);
    ApiService.updateGroup(id, updates).catch(e => console.warn('[Group] Update sync failed:', e.message));
  }, [groups]);

  const deleteGroup = useCallback(async (id: string) => {
    const updated = groups.filter(g => g.id !== id);
    setGroups(updated);
    await StorageService.saveGroups(updated);
    ApiService.deleteGroup(id).catch(e => console.warn('[Group] Delete sync failed:', e.message));
  }, [groups]);

  const archiveGroup = useCallback(async (groupId: string, archived: boolean) => {
    await updateGroup(groupId, { isArchived: archived });
  }, [updateGroup]);

  const addMember = useCallback(async (groupId: string, member: Member) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      const already = g.members.some(m => m.id === member.id || m.email === member.email);
      if (already) return g;
      return { ...g, members: [...g.members, member] };
    });
    setGroups(updated);
    await StorageService.saveGroups(updated);
    ApiService.addMember(groupId, member).catch(e => console.warn('[Member] Add sync failed:', e.message));
  }, [groups]);

  const removeMember = useCallback(async (groupId: string, memberId: string) => {
    const updated = groups.map(g =>
      g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g
    );
    setGroups(updated);
    await StorageService.saveGroups(updated);
    ApiService.removeMember(groupId, memberId).catch(e => console.warn('[Member] Remove sync failed:', e.message));
  }, [groups]);

  // ── Expense actions ──────────────────────────────────────────────

  const addExpense = useCallback(async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    const newExpense: Expense = { ...data, id: makeId('e') };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    await StorageService.saveExpenses(updated);
    ApiService.createExpense(newExpense).catch(e => console.warn('[Expense] Add sync failed:', e.message));
    return newExpense;
  }, [expenses]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    setExpenses(updated);
    await StorageService.saveExpenses(updated);
    ApiService.updateExpense(id, updates).catch(e => console.warn('[Expense] Update sync failed:', e.message));
  }, [expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    await StorageService.saveExpenses(updated);
    ApiService.deleteExpense(id).catch(e => console.warn('[Expense] Delete sync failed:', e.message));
  }, [expenses]);

  const settleDebt = useCallback(async (from: string, to: string, amount: number, method: string, groupId: string): Promise<Expense> => {
    return addExpense({
      groupId, amount, description: `Settlement via ${method}`,
      category: 'settlement', paidBy: from, splitAmong: [to],
      date: new Date().toISOString(), isSettlement: true, settlementFrom: from, settlementTo: to, method,
    });
  }, [addExpense]);

  const recordContribution = useCallback(async (memberId: string, memberName: string, amount: number, groupId: string): Promise<Expense> => {
    return addExpense({
      groupId, amount, description: `Contribution: ${memberName} contributed`,
      category: 'other', paidBy: memberId, splitAmong: [memberId],
      date: new Date().toISOString(), isContribution: true,
    });
  }, [addExpense]);

  // ── Notification actions ─────────────────────────────────────────

  const addNotification = useCallback((type: string, message: string) => {
    const notif: Notification = { id: makeId('n'), type, message, read: false, timestamp: new Date().toISOString() };
    setNotifications(prev => {
      const updated = [notif, ...prev];
      StorageService.saveNotifications(updated);
      return updated;
    });
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      StorageService.saveNotifications(updated);
      ApiService.markNotificationRead(id).catch(() => {});
      return updated;
    });
  }, []);

  const markAllNotifsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      StorageService.saveNotifications(updated);
      ApiService.markAllNotificationsRead().catch(() => {});
      return updated;
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Settings ─────────────────────────────────────────────────────

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    StorageService.setSetting('currency', code);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => { StorageService.setSetting('isDark', !prev); return !prev; });
  }, []);

  const setEmailAlerts = useCallback((val: boolean) => {
    setEmailAlertsState(val);
    StorageService.setSetting('emailAlerts', val);
  }, []);

  return (
    <AppContext.Provider value={{
      groups, expenses, notifications, isSyncing,
      createGroup, updateGroup, deleteGroup, addMember, removeMember, archiveGroup,
      addExpense, updateExpense, deleteExpense, settleDebt, recordContribution,
      addNotification, markNotifRead, markAllNotifsRead, unreadCount,
      syncAll,
      currency, currencySymbol, setCurrency,
      isDark, toggleTheme,
      emailAlertsEnabled: emailAlerts, setEmailAlerts,
      fmt,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
