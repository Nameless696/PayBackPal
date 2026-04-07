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
    return { success: false, message: apiErr.message || 'Invalid email or password' };
  }
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
    if (apiErr.message?.toLowerCase().includes('verify') || apiErr.message?.toLowerCase().includes('verification code has been sent')) {
      return { success: false, needsVerification: true, email, message: apiErr.message };
    }
    return { success: false, message: apiErr.message || 'Registration failed' };
  }
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

// ── Forgot Password ────────────────────────────────────────────────
export async function forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await ApiService.forgotPassword(email);
    return { success: true, message: res.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to send reset code' };
  }
}

// ── Reset Password ────────────────────────────────────────────────
export async function resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await ApiService.resetPassword(email, code, newPassword);
    return { success: true, user: res.user, message: res.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to reset password' };
  }
}

// ── Change Password ──────────────────────────────────────────────
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await ApiService.changePassword(currentPassword, newPassword);
    return { success: true, message: res.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Password update failed' };
  }
}

// ── Logout ────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await ApiService.logout();
  await StorageService.remove(StorageService.KEYS.USER);
  await StorageService.remove(StorageService.KEYS.NOTIFICATIONS);
  await StorageService.remove(StorageService.KEYS.GROUPS);
  await StorageService.remove(StorageService.KEYS.EXPENSES);
}

// ── Delete Account ────────────────────────────────────────────────

export async function deleteAccount(): Promise<{ success: boolean; message?: string }> {
  try {
    await ApiService.deleteAccount();
    await logout();
    return { success: true };
  } catch (apiErr: any) {
    return { success: false, message: apiErr.message || 'Failed to delete account' };
  }
}

// ── Update profile ─────────────────────────────────────────────

export async function updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await ApiService.updateProfile(updates);
    return { success: true, user: res.user };
  } catch (apiErr: any) {
    return { success: false, message: apiErr.message || 'Profile update failed' };
  }
}
