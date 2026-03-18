import ApiService from '../api/apiService';
import StorageService from '../services/storageService';
import type { LoginResult, SignupResult, User } from '../types';

declare const Buffer: { from(input: string): { toString(encoding: string): string } };

const NETWORK_ERRORS = ['failed to fetch', 'networkerror', 'econnrefused', 'load failed', 'network request failed'];

function isNetworkError(msg?: string): boolean {
  return NETWORK_ERRORS.some(k => msg?.toLowerCase().includes(k));
}

function stableId(email: string): string {
  const encoded = Buffer.from(email.toLowerCase().trim()).toString('base64');
  return 'u_' + encoded.replace(/[+/=]/g, '_');
}

function hashPassword(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

// ── Login ─────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await ApiService.login(email, password);
    return { success: true, user: res.user };
  } catch (apiErr: any) {
    if (apiErr.message?.toLowerCase().includes('verify')) {
      return { success: false, needsVerification: true, email, message: apiErr.message };
    }
    if (!isNetworkError(apiErr.message)) {
      return { success: false, message: apiErr.message || 'Invalid email or password' };
    }
    console.warn('[Auth] Backend unreachable, using local fallback');
  }
  return localLogin(email, password);
}

// ── Signup ────────────────────────────────────────────────────────

export async function signup(name: string, email: string, password: string): Promise<SignupResult> {
  try {
    const res = await ApiService.signup(name, email, password);
    if (res.needsVerification) {
      return { needsVerification: true, email: res.email, message: res.message };
    }
    return { success: true, user: res.user };
  } catch (apiErr: any) {
    if (!isNetworkError(apiErr.message)) {
      return { success: false, message: apiErr.message || 'Registration failed' };
    }
    console.warn('[Auth] Backend unreachable, using local fallback');
  }
  return localSignup(name, email, password);
}

// ── Verify email ─────────────────────────────────────────────────

export async function verifyEmail(email: string, code: string): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await ApiService.verifyEmail(email, code);
    return { success: true, user: res.user };
  } catch (err: any) {
    return { success: false, message: err.message || 'Verification failed' };
  }
}

// ── Resend code ──────────────────────────────────────────────────

export async function resendCode(email: string): Promise<void> {
  await ApiService.resendVerification(email);
}

// ── Logout ────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await ApiService.logout();
  await StorageService.remove(StorageService.KEYS.USER);
  await StorageService.remove(StorageService.KEYS.NOTIFICATIONS);
  await StorageService.remove(StorageService.KEYS.GROUPS);
  await StorageService.remove(StorageService.KEYS.EXPENSES);
}

// ── Update profile ─────────────────────────────────────────────

export async function updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User }> {
  try {
    const res = await ApiService.updateProfile(updates);
    return { success: true, user: res.user };
  } catch (e: any) {
    console.warn('[Auth] updateProfile failed:', e.message);
    return { success: false };
  }
}

// ── Local fallback helpers ────────────────────────────────────────

async function localLogin(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const creds = await StorageService.get<Record<string, number>>(StorageService.KEYS.CREDENTIALS, {});
  const storedHash = creds[normalizedEmail];

  if (!storedHash) return { success: false, message: 'No local account found. Connect to the server to register.' };
  if (storedHash !== hashPassword(password)) return { success: false, message: 'Incorrect password' };

  const existing = await StorageService.getUser();
  const name = existing?.email === normalizedEmail && existing.name ? existing.name : normalizedEmail.split('@')[0];

  const user: User = { id: stableId(normalizedEmail), name, email: normalizedEmail, avatar: name.charAt(0).toUpperCase() };
  return { success: true, user };
}

async function localSignup(name: string, email: string, password: string): Promise<SignupResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const creds = await StorageService.get<Record<string, number>>(StorageService.KEYS.CREDENTIALS, {});
  creds[normalizedEmail] = hashPassword(password);
  await StorageService.save(StorageService.KEYS.CREDENTIALS, creds);

  const user: User = { id: stableId(normalizedEmail), name: name.trim(), email: normalizedEmail, avatar: name.trim().charAt(0).toUpperCase() };
  return { success: true, user };
}
