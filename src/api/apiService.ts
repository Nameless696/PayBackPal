import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import type { Group, Expense, Notification, User } from '../types';

// ── Token (in-memory cache + AsyncStorage) ───────────────────────
let _cachedToken: string | null = null;

const JWT_KEY = 'paybackpal_jwt';

async function initToken(): Promise<void> {
  _cachedToken = await AsyncStorage.getItem(JWT_KEY);
}

async function setToken(val: string | null): Promise<void> {
  _cachedToken = val;
  if (val) await AsyncStorage.setItem(JWT_KEY, val);
  else     await AsyncStorage.removeItem(JWT_KEY);
}

function getTokenSync(): string | null { return _cachedToken; }

function _headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_cachedToken) h['Authorization'] = `Bearer ${_cachedToken}`;
  return h;
}

// ── HTTP helpers ─────────────────────────────────────────────────

const TIMEOUT_MS = 60000; // Increased to 60s to allow Render free-tier cold starts!

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function _handle(res: Response): Promise<any> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

async function _get(endpoint: string): Promise<any> {
  const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, { headers: _headers() });
  return _handle(res);
}

async function _post(endpoint: string, body: unknown): Promise<any> {
  const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    method: 'POST', headers: _headers(), body: JSON.stringify(body),
  });
  return _handle(res);
}

async function _patch(endpoint: string, body: unknown): Promise<any> {
  const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH', headers: _headers(), body: JSON.stringify(body),
  });
  return _handle(res);
}

async function _delete(endpoint: string): Promise<any> {
  const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers: _headers() });
  return _handle(res);
}

// ── Auth ─────────────────────────────────────────────────────────

async function login(email: string, password: string) {
  const res = await _post('/auth/login', { email, password });
  await setToken(res.token);
  return res;
}

async function signup(name: string, email: string, password: string) {
  return _post('/auth/register', { name, email, password });
}

async function verifyEmail(email: string, code: string) {
  const res = await _post('/auth/verify', { email, code });
  if (res.token) await setToken(res.token);
  return res;
}

async function resendVerification(email: string) {
  return _post('/auth/resend-verification', { email });
}

async function logout(): Promise<void> {
  await setToken(null);
}

async function getMe() { return _get('/auth/me'); }

async function updateProfile(updates: Partial<User>) {
  return _patch('/auth/profile', updates);
}

// ── Groups ───────────────────────────────────────────────────────

async function getGroups() { return _get('/groups'); }
async function createGroup(data: Partial<Group>) { return _post('/groups', data); }
async function getGroup(id: string) { return _get(`/groups/${id}`); }
async function updateGroup(id: string, updates: Partial<Group>) { return _patch(`/groups/${id}`, updates); }
async function deleteGroup(id: string) { return _delete(`/groups/${id}`); }
async function addMember(groupId: string, memberData: unknown) { return _post(`/groups/${groupId}/members`, memberData); }
async function removeMember(groupId: string, memberId: string) { return _delete(`/groups/${groupId}/members/${memberId}`); }

// ── Expenses ─────────────────────────────────────────────────────

async function getExpenses(groupId?: string) {
  const q = groupId ? `?groupId=${encodeURIComponent(groupId)}` : '';
  return _get(`/expenses${q}`);
}
async function createExpense(data: Partial<Expense>) { return _post('/expenses', data); }
async function updateExpense(id: string, updates: Partial<Expense>) { return _patch(`/expenses/${id}`, updates); }
async function deleteExpense(id: string) { return _delete(`/expenses/${id}`); }
async function settleDebt(data: unknown) { return _post('/expenses/settle', data); }

// ── Notifications ────────────────────────────────────────────────

async function getNotifications() { return _get('/notifications'); }
async function markNotificationRead(id: string) { return _patch(`/notifications/${id}`, { read: true }); }
async function markAllNotificationsRead() { return _patch('/notifications/read-all', {}); }

// ── Sync ─────────────────────────────────────────────────────────

async function syncAll(): Promise<{ groups: Group[]; expenses: Expense[]; notifications: Notification[] }> {
  return _get('/sync');
}

// ── Email ────────────────────────────────────────────────────────

async function sendEmail(payload: { to: string; subject: string; body: string; html?: string }): Promise<void> {
  await _post('/emails/send', payload).catch(e => console.warn('[Email] Backend send failed:', e.message));
}

// ── Health ───────────────────────────────────────────────────────

async function ping(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

const ApiService = {
  initToken, setToken, getTokenSync,
  login, signup, verifyEmail, resendVerification, logout, getMe, updateProfile,
  getGroups, createGroup, getGroup, updateGroup, deleteGroup, addMember, removeMember,
  getExpenses, createExpense, updateExpense, deleteExpense, settleDebt,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  syncAll, sendEmail, ping,
};

export default ApiService;
