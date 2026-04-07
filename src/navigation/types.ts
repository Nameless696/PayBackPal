import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ── Auth stack ───────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash:        undefined;
  Onboarding1:   undefined;
  Onboarding2:   undefined;
  Onboarding3:   undefined;
  Login:         undefined;
  Signup:        undefined;
  VerifyEmail:   { email: string };
  ForgotPassword: undefined;
};

// ── Main stack (wraps tabs + sub-screens) ────────────────────────

export type MainStackParamList = {
  Tabs:           undefined;
  GroupDetails:   { groupId: string };
  ReceiptStorage: undefined;
  Reports:        undefined;
  Settings:       undefined;
  ChangePassword: undefined;
};

// ── Bottom tab navigator ─────────────────────────────────────────

export type TabParamList = {
  Home:     undefined;
  Groups:   undefined;
  FAB:      undefined;
  Alerts:   undefined;
  Profile:  undefined;
};

// ── Screen prop helpers ───────────────────────────────────────────

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;
