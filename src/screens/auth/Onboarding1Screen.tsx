import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { AuthScreenProps } from '../../navigation/types';

const LOGO = require('../../assets/logo.png');

const SLIDES = [
  {
    emoji: '💰',
    title: 'Split Any Expense',
    body: 'Easily divide bills, trips, rent and any shared cost with your friends and family.',
    screen: 'Onboarding2' as const,
    dot: 0,
  },
];

export default function Onboarding1Screen({ navigation }: AuthScreenProps<'Onboarding1'>) {
  return (
    <LinearGradient colors={['#0D0D1A', '#12082A', '#1A0A3E']} style={styles.root}>
      {/* Logo centrepiece */}
      <View style={styles.logoWrap}>
        <View style={styles.logoGlow} />
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Split Any Expense</Text>
        <Text style={styles.body}>
          Easily divide bills, trips, rent and any shared cost with your friends and family.
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Buttons */}
      <View style={styles.btns}>
        <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('Onboarding2')}>
          <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={styles.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  logoGlow: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(108,99,255,0.12)',
  },
  logo: { width: 160, height: 160, borderRadius: 36 },
  textBlock: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 24, backgroundColor: '#6C63FF' },
  btns: { width: '100%' },
  nextBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  nextGrad: { paddingVertical: 16, alignItems: 'center' },
  nextTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
});
