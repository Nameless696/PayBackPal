import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { HandCoins } from 'lucide-react-native';
import type { AuthScreenProps } from '../../navigation/types';

export default function Onboarding3Screen({ navigation }: AuthScreenProps<'Onboarding3'>) {
  return (
    <LinearGradient colors={['#0D0D1A', '#12082A', '#0A2E14']} style={styles.root}>
      {/* Icon */}
      <View style={styles.iconWrap}>
        <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.iconCircle}>
          <HandCoins color="#FFF" size={52} />
        </LinearGradient>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>Settle Up Easily</Text>
        <Text style={styles.body}>
          Send payments via eSewa, Khalti, bank transfer, or cash and mark debts as settled instantly.
        </Text>
      </View>

      {/* Payment methods */}
      <View style={styles.chips}>
        {['eSewa', 'Khalti', 'Bank Transfer', 'Cash'].map(method => (
          <View key={method} style={styles.chip}>
            <Text style={styles.chipTxt}>{method}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <View style={styles.btns}>
        <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('Signup')}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextTxt}>Get Started 🚀</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.skipTxt}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { marginBottom: 36 },
  iconCircle: { width: 120, height: 120, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  textBlock: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 24 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 },
  chip: { backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipTxt: { color: '#86EFAC', fontSize: 12, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 24, backgroundColor: '#22C55E' },
  btns: { width: '100%' },
  nextBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  nextGrad: { paddingVertical: 16, alignItems: 'center' },
  nextTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
});
