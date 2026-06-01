import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Group, Expense, Notification, PersonalTransaction, Budget } from '../types';

export const KEYS = {
  USER:          'paybackpal_user',
  GROUPS:        'paybackpal_groups',
  EXPENSES:      'paybackpal_expenses',
  NOTIFICATIONS: 'paybackpal_notifications',
  RECEIPTS:      'paybackpal_receipts',
  SETTINGS:      'paybackpal_settings',
  JWT:           'paybackpal_jwt',
  CREDENTIALS:   'paybackpal_credentials',
  PERSONAL:      'paybackpal_personal',
  BUDGET:        'paybackpal_budget',
} as const;

async function save(key: string, data: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch { return false; }
}

async function get<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch { return defaultValue; }
}

async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

async function clear(): Promise<void> {
  await AsyncStorage.clear();
}

// ── Typed accessors ──────────────────────────────────────────────

const getUser       = () => get<User | null>(KEYS.USER, null);
const saveUser      = (u: User) => save(KEYS.USER, u);
const getGroups     = () => get<Group[]>(KEYS.GROUPS, []);
const saveGroups    = (g: Group[]) => save(KEYS.GROUPS, g);
const getExpenses   = () => get<Expense[]>(KEYS.EXPENSES, []);
const saveExpenses  = (e: Expense[]) => save(KEYS.EXPENSES, e);
const getNotifications  = () => get<Notification[]>(KEYS.NOTIFICATIONS, []);
const saveNotifications = (n: Notification[]) => save(KEYS.NOTIFICATIONS, n);
const getPersonalTransactions  = () => get<PersonalTransaction[]>(KEYS.PERSONAL, []);
const savePersonalTransactions = (t: PersonalTransaction[]) => save(KEYS.PERSONAL, t);
const getBudget  = () => get<Budget | null>(KEYS.BUDGET, null);
const saveBudget = (b: Budget | null) => save(KEYS.BUDGET, b);

async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const settings = await get<Record<string, unknown>>(KEYS.SETTINGS, {});
  return key in settings ? (settings[key] as T) : defaultValue;
}

async function setSetting(key: string, value: unknown): Promise<void> {
  const settings = await get<Record<string, unknown>>(KEYS.SETTINGS, {});
  settings[key] = value;
  await save(KEYS.SETTINGS, settings);
}

const StorageService = {
  KEYS,
  save, get, remove, clear,
  getUser, saveUser,
  getGroups, saveGroups,
  getExpenses, saveExpenses,
  getNotifications, saveNotifications,
  getPersonalTransactions, savePersonalTransactions,
  getBudget, saveBudget,
  getSetting, setSetting,
};

export default StorageService;
