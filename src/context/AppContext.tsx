import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Appearance, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useColorScheme } from 'nativewind';
import ApiService from '../api/apiService';
import StorageService from '../services/storageService';
import { currencies, DEFAULT_CURRENCY } from '../constants/currencies';
import type { Group, Expense, Notification, Member, User } from '../types';

// ── Helpers ───────────────────────────────────────────────────────

function makeId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
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
  joinGroup:     (groupId: string) => Promise<void>;

  // Expense actions
  addExpense:         (data: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense:      (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense:      (id: string) => Promise<void>;
  settleDebt:         (from: string, to: string, amount: number, method: string, groupId: string) => Promise<Expense>;
  recordContribution: (memberId: string, memberName: string, amount: number, groupId: string) => Promise<Expense>;
  addExpenseComment:  (expenseId: string, text: string, userId: string) => Promise<void>;

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
  const { colorScheme, setColorScheme } = useColorScheme();
  
  const [groups,        setGroups]        = useState<Group[]>([]);
  const [expenses,      setExpenses]      = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSyncing,     setIsSyncing]     = useState(false);
  const [currency,      setCurrencyState] = useState(DEFAULT_CURRENCY);
  const isDark = colorScheme === 'dark'; // derived — stays in sync with system
  const [emailAlerts,   setEmailAlertsState] = useState(true);

  // Follow the phone's system Dark/Light mode — re-applies whenever user changes OS setting
  useEffect(() => {
    const apply = (scheme: string | null | undefined) =>
      setColorScheme(scheme === 'light' ? 'light' : 'dark');
    apply(Appearance.getColorScheme());
    const sub = Appearance.addChangeListener(({ colorScheme }) => apply(colorScheme));
    return () => sub.remove();
  }, [setColorScheme]);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      const [g, e, n, cur, ea] = await Promise.all([
        StorageService.getGroups(),
        StorageService.getExpenses(),
        StorageService.getNotifications(),
        StorageService.getSetting<string>('currency', DEFAULT_CURRENCY),
        StorageService.getSetting<boolean>('emailAlerts', true),
      ]);
      setGroups(g);
      setExpenses(e);
      setNotifications(n);
      setCurrencyState(cur);
      setColorScheme(Appearance.getColorScheme() === 'light' ? 'light' : 'dark');
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

  // ── Notification base actions ────────────────────────────────────

  const addNotification = useCallback((type: string, message: string) => {
    const notif: Notification = { id: makeId('n'), type, message, read: false, timestamp: new Date().toISOString() };
    setNotifications(prev => {
      const updated = [notif, ...prev];
      StorageService.saveNotifications(updated);
      return updated;
    });
  }, []);

  // ── Group actions ────────────────────────────────────────────────

  const createGroup = useCallback(async (data: Omit<Group, 'id' | 'createdAt'>): Promise<Group> => {
    const tempId   = makeId('g');
    const newGroup: Group = { ...data, id: tempId, createdAt: new Date().toISOString() };
    const optimistic = [...groups, newGroup];
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGroups(optimistic);
    await StorageService.saveGroups(optimistic);
    addNotification('group_updated', `You created group "${newGroup.name}"`);

    try {
      const res      = await ApiService.createGroup(newGroup);
      const serverId = res?.group?._id ?? res?._id;
      if (serverId && serverId !== tempId) {
        const finalGroup = { ...newGroup, id: serverId };
        setGroups(prev => {
          const updated = prev.map(g => g.id === tempId ? finalGroup : g);
          StorageService.saveGroups(updated);
          return updated;
        });
        // Cascade: update any expenses already saved with the temp group id
        setExpenses(prev => {
          const hasStale = prev.some(e => e.groupId === tempId);
          if (!hasStale) return prev;
          const updated = prev.map(e => e.groupId === tempId ? { ...e, groupId: serverId } : e);
          StorageService.saveExpenses(updated);
          return updated;
        });
        return finalGroup;
      }
    } catch (e) {
      console.warn('[Group] Create sync failed:', (e as Error).message);
    }
    return newGroup;
  }, [groups, addNotification]);

  const updateGroup = useCallback(async (id: string, updates: Partial<Group>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = groups.map(g => g.id === id ? { ...g, ...updates } : g);
    setGroups(updated);
    await StorageService.saveGroups(updated);
    ApiService.updateGroup(id, updates).catch(e => console.warn('[Group] Update sync failed:', e.message));
  }, [groups]);

  const deleteGroup = useCallback(async (id: string) => {
    const target = groups.find(g => g.id === id);
    const updated = groups.filter(g => g.id !== id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGroups(updated);
    await StorageService.saveGroups(updated);
    if (target) addNotification('group_updated', `Group "${target.name}" was deleted`);
    ApiService.deleteGroup(id).catch(e => console.warn('[Group] Delete sync failed:', e.message));
  }, [groups, addNotification]);

  const archiveGroup = useCallback(async (groupId: string, archived: boolean) => {
    await updateGroup(groupId, { isArchived: archived });
  }, [updateGroup]);

  const addMember = useCallback(async (groupId: string, member: Member) => {
    const optimistic = groups.map(g => {
      if (g.id !== groupId) return g;
      const already = g.members.some(m => m.id === member.id || m.email === member.email);
      if (already) return g;
      return { ...g, members: [...g.members, member] };
    });
    setGroups(optimistic);
    await StorageService.saveGroups(optimistic);
    addNotification('member_added', `${member.name} joined the group`);
    ApiService.addMember(groupId, member)
      .then(res => {
        if (res?.group?.members) {
          setGroups(prev => {
            const updated = prev.map(g =>
              g.id === groupId ? { ...g, members: res.group.members } : g
            );
            StorageService.saveGroups(updated);
            return updated;
          });
        }
      })
      .catch(e => console.warn('[Member] Add sync failed:', e.message));
  }, [groups, addNotification]);

  const removeMember = useCallback(async (groupId: string, memberId: string) => {
    const updated = groups.map(g =>
      g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g
    );
    setGroups(updated);
    await StorageService.saveGroups(updated);
    ApiService.removeMember(groupId, memberId).catch(e => console.warn('[Member] Remove sync failed:', e.message));
  }, [groups]);

  const joinGroup = useCallback(async (groupId: string) => {
    const res = await ApiService.joinGroup(groupId);
    if (res?.group) {
      const joined = res.group;
      setGroups(prev => {
        const exists = prev.some(g => g.id === joined._id || g.id === joined.id);
        const updated = exists
          ? prev.map(g => (g.id === joined._id || g.id === joined.id) ? { ...g, ...joined, id: joined._id ?? joined.id } : g)
          : [...prev, { ...joined, id: joined._id ?? joined.id }];
        StorageService.saveGroups(updated);
        return updated;
      });
      addNotification('member_added', `You joined group "${joined.name}"`);
    }
  }, [addNotification]);

  // ── Expense actions ──────────────────────────────────────────────

  const addExpense = useCallback(async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    const tempId = makeId('e');
    const newExpense: Expense = { ...data, id: tempId };
    const optimistic = [...expenses, newExpense];
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpenses(optimistic);
    await StorageService.saveExpenses(optimistic);
    addNotification('expense_added', `Added expense: ${newExpense.description} for ${newExpense.amount}`);
    ApiService.createExpense(newExpense)
      .then(res => {
        const serverId = res?.expense?._id ?? res?._id;
        if (serverId && serverId !== tempId) {
          setExpenses(prev => {
            const updated = prev.map(e => e.id === tempId ? { ...e, id: serverId } : e);
            StorageService.saveExpenses(updated);
            return updated;
          });
        }
      })
      .catch(e => console.warn('[Expense] Add sync failed:', e.message));
    return newExpense;
  }, [expenses, addNotification]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    setExpenses(updated);
    await StorageService.saveExpenses(updated);
    ApiService.updateExpense(id, updates).catch(e => console.warn('[Expense] Update sync failed:', e.message));
  }, [expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const target = expenses.find(e => e.id === id);
    const updated = expenses.filter(e => e.id !== id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpenses(updated);
    await StorageService.saveExpenses(updated);
    if (target) addNotification('expense_deleted', `Deleted expense: ${target.description}`);
    ApiService.deleteExpense(id).catch(e => console.warn('[Expense] Delete sync failed:', e.message));
  }, [expenses, addNotification]);

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

  const addExpenseComment = useCallback(async (expenseId: string, text: string, userId: string) => {
    const updated = expenses.map(e => {
      if (e.id !== expenseId) return e;
      const newComment = { id: makeId('c'), userId, text, timestamp: new Date().toISOString() };
      return { ...e, comments: [...(e.comments || []), newComment] };
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpenses(updated);
    await StorageService.saveExpenses(updated);
    // Fire-and-forget sync to backend
    const target = updated.find(e => e.id === expenseId);
    if (target) ApiService.updateExpense(expenseId, { comments: target.comments }).catch(() => {});
  }, [expenses]);

  // ── Notification actions ─────────────────────────────────────────

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
    // App follows system theme — toggle is preserved for API compatibility
    setColorScheme('system');
  }, [setColorScheme]);

  const setEmailAlerts = useCallback((val: boolean) => {
    setEmailAlertsState(val);
    StorageService.setSetting('emailAlerts', val);
  }, []);

  return (
    <AppContext.Provider value={{
      groups, expenses, notifications, isSyncing,
      createGroup, updateGroup, deleteGroup, addMember, removeMember, archiveGroup, joinGroup,
      addExpense, updateExpense, deleteExpense, settleDebt, recordContribution, addExpenseComment,
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
