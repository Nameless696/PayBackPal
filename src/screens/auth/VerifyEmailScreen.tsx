import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import type { AuthScreenProps } from '../../navigation/types';

export default function VerifyEmailScreen({ navigation, route }: AuthScreenProps<'VerifyEmail'>) {
  const { email } = route.params;
  const { verifyEmail, resendCode } = useAuth();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [resent,  setResent]  = useState(false);

  async function handleVerify() {
    if (code.length !== 6) { Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'Please enter the full 6-digit code' }); return; }
    setLoading(true);
    try {
      const result = await verifyEmail(email, code.trim());
      if (!result.success) Toast.show({ type: 'error', text1: 'Verification Failed', text2: result.message ?? 'Invalid or expired code' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendCode(email);
      setResent(true);
      Toast.show({ type: 'success', text1: 'Code Sent!', text2: 'A new code has been sent to your email' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message ?? 'Could not resend code' });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={{ padding: 32, paddingBottom: 32 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-white/80 text-[15px]">← Back</Text>
        </TouchableOpacity>
        <Text className="text-[26px] font-extrabold text-white">Verify Email 📧</Text>
        <Text className="text-sm text-white/80 mt-1">We sent a 6-digit code to</Text>
        <Text className="text-[15px] text-white font-bold mt-1">{email}</Text>
      </LinearGradient>

      <View className="flex-1 p-6">
        <Text className="text-text-2 text-sm font-semibold mb-3 text-center">Enter verification code</Text>
        <TextInput
          className="bg-bg-card border-2 border-primary rounded-2xl py-5 text-[32px] font-extrabold text-text-1 mb-6 text-center"
          style={{ letterSpacing: 12 }}
          value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000" placeholderTextColor="#6B6890"
          keyboardType="number-pad" maxLength={6}
          autoFocus textAlign="center"
        />
        <TouchableOpacity disabled={loading} className="bg-primary rounded-[14px] py-4 items-center mb-3" onPress={handleVerify}>
          <Text className="text-white text-base font-bold">{loading ? 'Verifying…' : 'Verify Email ✓'}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="py-[14px] items-center" onPress={handleResend}>
          <Text className="text-text-2 text-[15px]">{resent ? 'Code resent ✓' : 'Resend code'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
