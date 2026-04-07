import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import { currencies } from '../../constants/currencies';
import { Lock, Trash2, Compass, Bell, ChevronRight } from 'lucide-react-native';
import { useTour } from '../../hooks/useTour';
import type { MainStackParamList } from '../../navigation/types';
import { useThemeColors, type ThemeColors } from '../../hooks/useThemeColors';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { deleteAccount } = useAuth();
  const { currency, setCurrency, emailAlertsEnabled, setEmailAlerts } = useApp();
  const { openEditProfile } = useModal();
  const { resetTour } = useTour();
  const C      = useThemeColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action is irreversible and will delete all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAccount();
            if (!res.success) Alert.alert('Error', res.message);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Core Preferences */}
        <Text style={styles.sectionLabel}>Core Preferences</Text>
        <View style={styles.card}>


          {/* Email Alerts */}
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Bell color="#4F9EFF" size={16} />
            </View>
            <Text style={styles.rowLabel}>Email Alerts</Text>
            <Switch value={emailAlertsEnabled} onValueChange={setEmailAlerts} trackColor={{ true: '#6C63FF', false: '#2D2B45' }} thumbColor="#FFF" />
          </View>

          <View style={styles.divider} />

          {/* Currency */}
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            <Text style={[styles.rowLabel, { width: '100%', marginBottom: 12 }]}>Default Currency</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(currencies).map(([code, { symbol }]) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.currencyChip, currency === code && styles.currencyChipActive]}
                  onPress={() => setCurrency(code)}
                >
                  <Text style={[styles.currencyTxt, currency === code && styles.currencyTxtActive]}>
                    {symbol} {code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* App Guide */}
        <Text style={styles.sectionLabel}>Help & Guidance</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              resetTour();
              navigation.goBack();
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(108,99,255,0.12)' }]}>
              <Compass color="#6C63FF" size={16} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>App Feature Guide</Text>
              <Text style={styles.rowSub}>Restart the interactive tour</Text>
            </View>
            <ChevronRight color="#6B6890" size={18} />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <Text style={styles.sectionLabel}>Security Controls</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={styles.iconWrap}>
              <Lock color="#6C63FF" size={16} />
            </View>
            <Text style={[styles.rowLabel, { flex: 1 }]}>Change Password</Text>
            <ChevronRight color="#6B6890" size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Trash2 color="#EF4444" size={16} />
            </View>
            <Text style={[styles.rowLabel, { flex: 1, color: '#EF4444' }]}>Delete Account Forever</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ThemeColors) {
  return StyleSheet.create({
    root:        { flex: 1, backgroundColor: C.bg },
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    backBtn:     { marginRight: 12, padding: 4 },
    backArrow:   { color: C.text2, fontSize: 28, fontWeight: '300' },
    headerTitle: { color: C.text1, fontSize: 22, fontWeight: '800' },
    sectionLabel: {
      color: C.muted, fontSize: 11, fontWeight: '700',
      letterSpacing: 1.2, textTransform: 'uppercase',
      marginLeft: 20, marginTop: 20, marginBottom: 8,
    },
    card: {
      marginHorizontal: 16, backgroundColor: C.card,
      borderRadius: 20, borderWidth: 1, borderColor: C.border,
      paddingVertical: 4, paddingHorizontal: 16,
    },
    row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    iconWrap:    { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(108,99,255,0.12)', justifyContent: 'center', alignItems: 'center' },
    rowLabel:    { color: C.text1, fontSize: 15, fontWeight: '600', flex: 1 },
    rowSub:      { color: C.muted, fontSize: 12, marginTop: 2 },
    divider:     { height: 1, backgroundColor: C.borderSolid, marginLeft: 44 },
    currencyChip: {
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 10, borderWidth: 1.5,
      borderColor: C.border, backgroundColor: C.surface,
    },
    currencyChipActive:   { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
    currencyTxt:          { color: C.text2, fontSize: 13, fontWeight: '600' },
    currencyTxtActive:    { color: '#FFF' },
  });
}
