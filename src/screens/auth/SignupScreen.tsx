import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import type { AuthScreenProps } from '../../navigation/types';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function SignupScreen({ navigation }: AuthScreenProps<'Signup'>) {
  const { signup } = useAuth();
  const C = useThemeColors();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);

  function err(title: string, msg: string) {
    Toast.show({ type: 'error', text1: title, text2: msg, position: 'top' });
  }

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      err('Missing Fields', 'All fields are required'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      err('Invalid Email', 'Please enter a valid email address'); return;
    }
    if (password.length < 8) {
      err('Weak Password', 'Password must be at least 8 characters'); return;
    }
    if (password !== confirm) {
      err('Password Mismatch', 'Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const result = await signup(name.trim(), email.trim(), password);
      if (result.needsVerification) {
        navigation.navigate('VerifyEmail', { email: result.email ?? email });
      } else if (result.success) {
        Toast.show({ type: 'success', text1: '🎉 Account Created!', text2: `Welcome aboard, ${name.trim()}` });
      } else {
        err('Sign Up Failed', result.message ?? 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Gradient Header ─────────────────── */}
          <LinearGradient colors={['#5B52E8', '#4F9EFF']} style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backTxt}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Join PayBackPal today</Text>
          </LinearGradient>

          {/* ── Form ────────────────────────────── */}
          <View style={s.form}>
            <Text style={[s.label, { color: C.text2 }]}>Full Name</Text>
            <TextInput
              style={[s.input, { backgroundColor: C.card, color: C.text1, borderColor: C.border }]}
              value={name} onChangeText={setName}
              placeholder="John Doe" placeholderTextColor="#6B6890"
              autoCapitalize="words" returnKeyType="next"
            />

            <Text style={[s.label, { color: C.text2 }]}>Email</Text>
            <TextInput
              style={[s.input, { backgroundColor: C.card, color: C.text1, borderColor: C.border }]}
              value={email} onChangeText={setEmail}
              placeholder="your@email.com" placeholderTextColor="#6B6890"
              keyboardType="email-address" autoCapitalize="none" returnKeyType="next"
            />

            <Text style={[s.label, { color: C.text2 }]}>
              Password  <Text style={[s.labelNote, { color: C.muted }]}>min 8 characters</Text>
            </Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <TextInput
                style={[s.inputFlex, { color: C.text1 }]}
                value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor="#6B6890"
                secureTextEntry={!showPw} returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn}>
                {showPw
                  ? <EyeOff color="#6B6890" size={20} />
                  : <Eye    color="#6B6890" size={20} />}
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: C.text2 }]}>Confirm Password</Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <TextInput
                style={[s.inputFlex, { color: C.text1 }]}
                value={confirm} onChangeText={setConfirm}
                placeholder="••••••••" placeholderTextColor="#6B6890"
                secureTextEntry={!showCf} returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
              <TouchableOpacity onPress={() => setShowCf(v => !v)} style={s.eyeBtn}>
                {showCf
                  ? <EyeOff color="#6B6890" size={20} />
                  : <Eye    color="#6B6890" size={20} />}
              </TouchableOpacity>
            </View>

            {/* ── CTA ─────────────────────────────── */}
            <TouchableOpacity
              disabled={loading}
              style={[s.btn, loading && { opacity: 0.65 }]}
              onPress={handleSignup}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6C63FF', '#4F9EFF']}
                style={s.btnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {loading && <ActivityIndicator size="small" color="#FFF" />}
                  <Text style={s.btnTxt}>
                    {loading ? 'Creating account…' : 'Create Account'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.signinRow} onPress={() => navigation.navigate('Login')}>
              <Text style={[s.signinTxt, { color: C.muted }]}>
                Already have an account?{'  '}
                <Text style={s.signinLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0F0F1A' },
  header:     { padding: 32, paddingTop: 40, paddingBottom: 40 },
  backBtn:    { marginBottom: 20 },
  backTxt:    { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  title:      { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle:   { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 6 },

  form:       { padding: 24 },
  label:      { color: '#B8B5D1', fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  labelNote:  { color: '#6B6890', fontWeight: '400', fontSize: 12 },

  input: {
    backgroundColor: '#1A1A2E',
    color: '#F1F0FF',
    padding: 16,
    borderRadius: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  inputFlex:  { flex: 1, color: '#F1F0FF', padding: 16, fontSize: 15 },
  eyeBtn:     { paddingHorizontal: 14 },

  btn:        { marginTop: 32, borderRadius: 14, overflow: 'hidden' },
  btnGrad:    { paddingVertical: 17, alignItems: 'center' },
  btnTxt:     { color: '#FFF', fontSize: 16, fontWeight: '700' },

  signinRow:  { alignItems: 'center', paddingVertical: 20 },
  signinTxt:  { color: '#6B6890', fontSize: 14 },
  signinLink: { color: '#6C63FF', fontWeight: '700' },
});
