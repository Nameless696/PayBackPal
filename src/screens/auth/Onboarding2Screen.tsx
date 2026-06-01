import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import type { AuthScreenProps } from '../../navigation/types';

const LOGO = require('../../assets/logo.jpg');

export default function Onboarding2Screen({ navigation }: AuthScreenProps<'Onboarding2'>) {
  return (
    <LinearGradient colors={['#0D0D1A', '#12082A', '#0A1A2E']} style={styles.root}>
      {/* Icon */}
      <View style={styles.iconWrap}>
        <LinearGradient colors={['#4F9EFF', '#6C63FF']} style={styles.iconCircle}>
          <TrendingUp color="#FFF" size={52} />
        </LinearGradient>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>Track Balances</Text>
        <Text style={styles.body}>
          See at a glance who owes what. Real-time balance updates keep everyone on the same page.
        </Text>
      </View>

      {/* Feature chips */}
      <View style={styles.chips}>
        {['Live sync', 'Who owes who', 'Rs / USD / EUR'].map(chip => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipTxt}>{chip}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>

      <View style={styles.btns}>
        <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('Onboarding3')}>
          <LinearGradient colors={['#4F9EFF', '#6C63FF']} style={styles.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextTxt}>Next →</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.skipTxt}>Skip for now</Text>
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
  chip: { backgroundColor: 'rgba(108,99,255,0.18)', borderWidth: 1, borderColor: 'rgba(108,99,255,0.4)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipTxt: { color: '#A8A4FF', fontSize: 12, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 24, backgroundColor: '#4F9EFF' },
  btns: { width: '100%' },
  nextBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  nextGrad: { paddingVertical: 16, alignItems: 'center' },
  nextTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
});
