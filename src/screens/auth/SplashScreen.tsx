import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const LOGO = require('../../assets/logo.jpg');

export default function SplashScreen({ navigation }: any) {
  const scale  = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring   = useRef(new Animated.Value(0.8)).current;
  const ringOp = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    // Pulsing ring loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring,   { toValue: 1.5, duration: 1400, useNativeDriver: true }),
          Animated.timing(ringOp, { toValue: 0,   duration: 1400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ring,   { toValue: 0.8, duration: 0,    useNativeDriver: true }),
          Animated.timing(ringOp, { toValue: 0.6, duration: 0,    useNativeDriver: true }),
        ]),
      ])
    ).start();

    if (navigation) {
      const t = setTimeout(() => navigation.replace('Onboarding1'), 2400);
      return () => clearTimeout(t);
    }
  }, [navigation]);

  return (
    <LinearGradient colors={['#0D0D1A', '#12082A', '#0D0D1A']} style={styles.root}>
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>

        {/* Pulsing glow ring behind logo */}
        <Animated.View style={[styles.ring, { transform: [{ scale: ring }], opacity: ringOp }]} />

        {/* Logo image */}
        <View style={styles.logoWrap}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Brand text */}
        <Text style={styles.brand}>PayBackPal</Text>
        <Text style={styles.tagline}>Split Expenses · Stay Friends</Text>

        {/* Loading dots */}
        <View style={styles.dotsRow}>
          {[0, 160, 320].map((delay, i) => (
            <LoadingDot key={i} delay={delay} />
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1,    duration: 520, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.25, duration: 520, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return <Animated.View style={[styles.dot, { opacity }]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center' },

  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(108,99,255,0.45)',
  },

  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 34,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(108,99,255,0.35)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },

  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
    marginBottom: 44,
  },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C63FF',
  },
});
