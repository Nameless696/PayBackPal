import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { changePassword } from '../../services/authService';
import type { MainScreenProps } from '../../navigation/types';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function ChangePasswordScreen({ navigation }: MainScreenProps<'ChangePassword'>) {
  const C = useThemeColors();
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);

  function err(title: string, msg: string) {
    Toast.show({ type: 'error', text1: title, text2: msg, position: 'top' });
  }

  async function handleChange() {
    if (!currentPw || !newPw || !confirmPw) {
      err('Missing Fields', 'All fields are required'); return;
    }
    if (newPw.length < 8) {
      err('Weak Password', 'New password must be at least 8 characters'); return;
    }
    if (newPw !== confirmPw) {
      err('Password Mismatch', 'New passwords do not match'); return;
    }
    if (newPw === currentPw) {
      err('Same Password', 'New password must be different from current password'); return;
    }
    setLoading(true);
    const result = await changePassword(currentPw, newPw);
    setLoading(false);
    if (result.success) {
      Toast.show({ type: 'success', text1: '✅ Password Updated', text2: 'Your password has been changed.' });
      navigation.goBack();
    } else {
      err('Update Failed', result.message || 'Failed to update password');
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
          <LinearGradient colors={['#1A0A3E', '#6C63FF']} style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backTxt}>← Back</Text>
            </TouchableOpacity>
            <View style={s.lockBadge}>
              <Lock color="#FFF" size={28} />
            </View>
            <Text style={s.title}>Change Password</Text>
            <Text style={s.subtitle}>Keep your account secure</Text>
          </LinearGradient>

          {/* ── Form ────────────────────────────── */}
          <View style={s.form}>
            <Text style={[s.label, { color: C.text2 }]}>Current Password</Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <TextInput
                style={[s.inputFlex, { color: C.text1 }]}
                value={currentPw} onChangeText={setCurrentPw}
                placeholder="••••••••" placeholderTextColor="#6B6890"
                secureTextEntry={!showCur} returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowCur(v => !v)} style={s.eyeBtn}>
                {showCur ? <EyeOff color="#6B6890" size={20} /> : <Eye color="#6B6890" size={20} />}
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: C.text2 }]}>New Password <Text style={[s.labelNote, { color: C.muted }]}>min 8 characters</Text></Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <TextInput
                style={[s.inputFlex, { color: C.text1 }]}
                value={newPw} onChangeText={setNewPw}
                placeholder="••••••••" placeholderTextColor="#6B6890"
                secureTextEntry={!showNew} returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={s.eyeBtn}>
                {showNew ? <EyeOff color="#6B6890" size={20} /> : <Eye color="#6B6890" size={20} />}
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: C.text2 }]}>Confirm New Password</Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <TextInput
                style={[s.inputFlex, { color: C.text1 }]}
                value={confirmPw} onChangeText={setConfirmPw}
                placeholder="••••••••" placeholderTextColor="#6B6890"
                secureTextEntry={!showCon} returnKeyType="done"
                onSubmitEditing={handleChange}
              />
              <TouchableOpacity onPress={() => setShowCon(v => !v)} style={s.eyeBtn}>
                {showCon ? <EyeOff color="#6B6890" size={20} /> : <Eye color="#6B6890" size={20} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              disabled={loading}
              style={[s.btn, loading && { opacity: 0.65 }]}
              onPress={handleChange}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#6C63FF', '#4F9EFF']}
                style={s.btnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={s.btnTxt}>{loading ? 'Updating…' : 'Update Password'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0F0F1A' },
  header:    { padding: 32, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  backBtn:   { alignSelf: 'flex-start', marginBottom: 20 },
  backTxt:   { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  lockBadge: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  title:     { color: '#FFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle:  { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },

  form:      { padding: 24 },
  label:     { color: '#B8B5D1', fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  labelNote: { color: '#6B6890', fontWeight: '400', fontSize: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  inputFlex: { flex: 1, color: '#F1F0FF', padding: 16, fontSize: 15 },
  eyeBtn:    { paddingHorizontal: 14 },

  btn:       { marginTop: 32, borderRadius: 14, overflow: 'hidden' },
  btnGrad:   { paddingVertical: 17, alignItems: 'center' },
  btnTxt:    { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
