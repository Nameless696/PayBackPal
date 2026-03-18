import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import type { AuthScreenProps } from '../../navigation/types';

export default function SignupScreen({ navigation }: AuthScreenProps<'Signup'>) {
  const { signup } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSignup() {
    if (!name || !email || !password || !confirm) { Alert.alert('Error', 'All fields are required'); return; }
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await signup(name.trim(), email.trim(), password);
      if (result.needsVerification) {
        navigation.navigate('VerifyEmail', { email: result.email ?? email });
      } else if (!result.success) {
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
          {[
            { label: 'Full Name',         value: name,     setter: setName,     placeholder: 'John Doe',       type: 'default'       as const },
            { label: 'Email',             value: email,    setter: setEmail,    placeholder: 'your@email.com', type: 'email-address' as const },
            { label: 'Password',          value: password, setter: setPassword, placeholder: '••••••••',       secure: true },
            { label: 'Confirm Password',  value: confirm,  setter: setConfirm,  placeholder: '••••••••',       secure: true },
          ].map(({ label, value, setter, placeholder, type, secure }) => (
            <View key={label}>
              <Text className="text-text-2 text-[13px] font-semibold mb-1.5 mt-4">{label}</Text>
              <TextInput
                className="bg-bg-card border border-border rounded-xl p-[14px] text-text-1 text-[15px]"
                value={value} onChangeText={setter}
                placeholder={placeholder} placeholderTextColor="#6B6890"
                keyboardType={type ?? 'default'}
                autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                secureTextEntry={secure}
              />
            </View>
          ))}

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
