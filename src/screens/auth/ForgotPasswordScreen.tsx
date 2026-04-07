import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { forgotPassword, resetPassword } from '../../services/authService';
import type { AuthScreenProps } from '../../navigation/types';

export default function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!email) { Toast.show({ type: 'error', text1: 'Email Required', text2: 'Please enter your email address' }); return; }
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.success) {
      setStep(2);
      Toast.show({ type: 'success', text1: 'Code Sent', text2: result.message });
    } else {
      Toast.show({ type: 'error', text1: 'Failed', text2: result.message || 'Failed to send recovery code' });
    }
  }

  async function handleResetPassword() {
    if (!code || !newPassword) { Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter the code and a new password' }); return; }
    if (newPassword.length < 8) { Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must be at least 8 characters' }); return; }
    setLoading(true);
    const result = await resetPassword(email.trim(), code.trim(), newPassword);
    setLoading(false);
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Password Reset Successful!', text2: 'You can now sign in.' });
      navigation.navigate('Login');
    } else {
      Toast.show({ type: 'error', text1: 'Reset Failed', text2: result.message || 'Failed to reset password' });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={{ padding: 32, paddingBottom: 40, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-8 left-8">
            <Text className="text-white/80 font-bold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-[48px] mt-6 mb-3">🔑</Text>
          <Text className="text-[26px] font-extrabold text-white">Reset Password</Text>
          <Text className="text-sm text-white/80 mt-1">
            {step === 1 ? "Enter your email to receive a recovery code" : "Enter your recovery code and new password"}
          </Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <>
              <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-2">Email Address</Text>
              <TextInput
                className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[15px]"
                value={email} onChangeText={setEmail}
                placeholder="registered@email.com" placeholderTextColor="#6B6890"
                keyboardType="email-address" autoCapitalize="none"
              />
              <TouchableOpacity disabled={loading} className="bg-primary rounded-[14px] py-4 items-center mt-6" onPress={handleSendCode}>
                <Text className="text-white text-base font-bold">{loading ? 'Sending Code…' : 'Send Recovery Code'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-2">Recovery Code</Text>
              <TextInput
                className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[20px] text-center tracking-[8px]"
                value={code} onChangeText={setCode}
                placeholder="123456" placeholderTextColor="#6B6890"
                keyboardType="number-pad" maxLength={6}
              />
              <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-6">New Password</Text>
              <TextInput
                className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[15px]"
                value={newPassword} onChangeText={setNewPassword}
                placeholder="••••••••" placeholderTextColor="#6B6890"
                secureTextEntry={true}
              />
              <TouchableOpacity disabled={loading} className="bg-primary rounded-[14px] py-4 items-center mt-8" onPress={handleResetPassword}>
                <Text className="text-white text-base font-bold">{loading ? 'Resetting…' : 'Confirm New Password'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
