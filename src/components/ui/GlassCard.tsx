import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing,
  interpolate,
} from 'react-native-reanimated';
import { TrendingUp, CreditCard, Users } from 'lucide-react-native';

interface Props {
  totalOwed: string;
  youOwe: string;
  totalSpent: string;
  groupCount: number;
  currencySymbol?: string;
}

export default function GlassCard({ totalOwed, youOwe, totalSpent, groupCount, currencySymbol = '₨' }: Props) {
  const rotation = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1, false
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.03, 0.08]),
  }));

  return (
    <View style={styles.card}>
      {/* Dark base with deeper gradient */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#0F0524', '#0D0D1A', '#0A1428']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Animated shimmer overlay for glass feel */}
      <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Spinning glow orb */}
      <Animated.View style={[styles.orb, orbStyle]}>
        <LinearGradient
          colors={['rgba(108,99,255,0.5)', 'rgba(79,158,255,0.25)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Second subtle orb — bottom-left for depth */}
      <View style={styles.orbSecondary}>
        <LinearGradient
          colors={['rgba(79,158,255,0.15)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Top glass edge highlight */}
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
        style={styles.glassEdge}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.headerBadge}>
            <TrendingUp color="#FFF" size={14} />
            <Text style={styles.headerBadgeText}>PayBackPal</Text>
          </View>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>{currencySymbol}</Text>
          </View>
        </View>

        {/* Main balance */}
        <Text style={styles.labelSmall}>You're owed</Text>
        <Text style={styles.mainAmount}>{totalOwed}</Text>

        {/* Glass divider */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
          style={styles.divider}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <CreditCard color="#FFA07A" size={12} />
            </View>
            <View>
              <Text style={styles.statLabel}>You owe</Text>
              <Text style={styles.statValueWarn}>{youOwe}</Text>
            </View>
          </View>
          <View style={styles.statItemSep} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <TrendingUp color="#A5B4FC" size={12} />
            </View>
            <View>
              <Text style={styles.statLabel}>Total spent</Text>
              <Text style={styles.statValue}>{totalSpent}</Text>
            </View>
          </View>
          <View style={styles.statItemSep} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Users color="#93C5FD" size={12} />
            </View>
            <View>
              <Text style={styles.statLabel}>Groups</Text>
              <Text style={styles.statValue}>{groupCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 210,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.25)',
    // Glass shadow
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  glassEdge: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1.5,
  },
  orb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -35,
    right: -35,
    overflow: 'hidden',
  },
  orbSecondary: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -30,
    left: -20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  currencyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108,99,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.5)',
  },
  currencyText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },
  labelSmall: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  mainAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItemSep: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statValueWarn: {
    color: '#FFA07A',
    fontSize: 13,
    fontWeight: '700',
  },
});
