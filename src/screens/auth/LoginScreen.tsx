import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import type { AuthScreenProps } from '../../navigation/types';

export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Error', 'Email and password are required'); return; }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.needsVerification) {
        navigation.navigate('VerifyEmail', { email: result.email ?? email });
      } else if (result.success) {
        Toast.show({ type: 'success', text1: 'Welcome back!', text2: `Signed in successfully` });
      } else {
        Alert.alert('Sign In Failed', result.message ?? 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={{ padding: 32, paddingBottom: 40, alignItems: 'center' }}>
          <Text className="text-[48px] mb-3">💸</Text>
          <Text className="text-[26px] font-extrabold text-white">Welcome Back!</Text>
          <Text className="text-sm text-white/80 mt-1">Sign in to your account</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">Email</Text>
          <TextInput
            className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[15px]"
            value={email} onChangeText={setEmail}
            placeholder="your@email.com" placeholderTextColor="#6B6890"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email"
          />

          <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">Password</Text>
          <View className="relative">
            <TextInput
              className="bg-bg-card border border-border rounded-xl p-[14px] pr-12 text-text-1 text-[15px]"
              value={password} onChangeText={setPassword}
              placeholder="••••••••" placeholderTextColor="#6B6890"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 z-10">
              <Text className="text-lg opacity-80">{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="self-end mt-2" onPress={() => Alert.alert('Password Reset', 'In Local mode, please create a new account or test with an existing local credential.')}>
            <Text className="text-primary text-[13px] font-semibold">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={loading} className="bg-primary rounded-[14px] py-4 items-center mt-6" onPress={handleLogin}>
            <Text className="text-white text-base font-bold">{loading ? 'Signing in…' : 'Sign In'}</Text>
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
