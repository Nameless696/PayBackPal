import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import type { AuthScreenProps } from '../../navigation/types';

const LOGO = require('../../assets/logo.jpg');

export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Email and password are required' }); return; }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.needsVerification) {
        navigation.navigate('VerifyEmail', { email: result.email ?? email });
      } else if (result.success) {
        Toast.show({ type: 'success', text1: 'Welcome back!', text2: `Signed in successfully` });
      } else {
        Toast.show({ type: 'error', text1: 'Sign In Failed', text2: result.message ?? 'Invalid email or password' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#12082A', '#1A0A3E', '#6C63FF']} style={loginStyles.header}>
          <View style={loginStyles.logoWrap}>
            <Image source={LOGO} style={loginStyles.logo} resizeMode="contain" />
          </View>
          <Text style={loginStyles.title}>Welcome Back!</Text>
          <Text style={loginStyles.subtitle}>Sign in to your account</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">Email</Text>
          <TextInput
            className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[15px]"
            value={email} onChangeText={setEmail}
            placeholder="your@email.com" placeholderTextColor="#6B6890"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email"
            accessibilityLabel="Email address"
          />

          <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">Password</Text>
          <View className="relative">
            <TextInput
              className="bg-bg-card border border-border rounded-xl p-[14px] pr-12 text-text-1 text-[15px]"
              value={password} onChangeText={setPassword}
              placeholder="••••••••" placeholderTextColor="#6B6890"
              secureTextEntry={!showPassword}
              accessibilityLabel="Password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 z-10" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} accessibilityRole="button">
              {showPassword ? <EyeOff color="#6B6890" size={20} /> : <Eye color="#6B6890" size={20} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="self-end mt-2" onPress={() => navigation.navigate('ForgotPassword')} accessibilityLabel="Forgot password" accessibilityRole="link">
            <Text className="text-primary text-[13px] font-semibold">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={loading} className="bg-primary rounded-[14px] py-4 items-center mt-6" style={loading ? { opacity: 0.65 } : undefined} onPress={handleLogin} accessibilityLabel={loading ? 'Signing in' : 'Sign in'} accessibilityRole="button">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {loading && <ActivityIndicator size="small" color="#FFF" />}
              <Text className="text-white text-base font-bold">{loading ? 'Signing in…' : 'Sign In'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-4" onPress={() => navigation.navigate('Signup')}>
            <Text className="text-text-2 text-sm">
              Don't have an account? <Text className="text-primary font-bold">Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const loginStyles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(108,99,255,0.4)',
  },
  logo: { width: '100%', height: '100%' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
});

