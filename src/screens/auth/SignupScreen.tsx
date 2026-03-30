import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import type { AuthScreenProps } from '../../navigation/types';

export default function SignupScreen({ navigation }: AuthScreenProps<'Signup'>) {
  const { signup } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  async function handleSignup() {
    if (!name || !email || !password || !confirm) { Alert.alert('Error', 'All fields are required'); return; }
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await signup(name.trim(), email.trim(), password);
      if (result.needsVerification) {
        navigation.navigate('VerifyEmail', { email: result.email ?? email });
      } else if (result.success) {
        Toast.show({ type: 'success', text1: 'Account Created!', text2: `Welcome aboard, ${name.trim()}` });
      } else {
        Alert.alert('Sign Up Failed', result.message ?? 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={{ padding: 32, paddingBottom: 32 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
            <Text className="text-white/80 text-[15px]">← Back</Text>
          </TouchableOpacity>
          <Text className="text-[26px] font-extrabold text-white">Create Account</Text>
          <Text className="text-sm text-white/80 mt-1">Join PayBackPal today</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">Full Name</Text>
          <TextInput
            className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[15px]"
            value={name} onChangeText={setName}
            placeholder="John Doe" placeholderTextColor="#6B6890"
            autoCapitalize="words"
          />

          <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">Email</Text>
          <TextInput
            className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[15px]"
            value={email} onChangeText={setEmail}
            placeholder="your@email.com" placeholderTextColor="#6B6890"
            keyboardType="email-address" autoCapitalize="none"
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

          <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">Confirm Password</Text>
          <View className="relative">
            <TextInput
              className="bg-bg-card border border-border rounded-xl p-[14px] pr-12 text-text-1 text-[15px]"
              value={confirm} onChangeText={setConfirm}
              placeholder="••••••••" placeholderTextColor="#6B6890"
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-3.5 z-10">
              <Text className="text-lg opacity-80">{showConfirm ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity disabled={loading} className="bg-primary rounded-[14px] py-4 items-center mt-6" onPress={handleSignup}>
            <Text className="text-white text-base font-bold">
              {loading ? 'Creating account…' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-4" onPress={() => navigation.navigate('Login')}>
            <Text className="text-text-2 text-sm">
              Already have an account? <Text className="text-primary font-bold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
