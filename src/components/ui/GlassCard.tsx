import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { TrendingUp, CreditCard, Users } from 'lucide-react-native';

interface Props {
  totalOwed: string;
  youOwe: string;
  totalSpent: string;
  groupCount: number;
}

export default function GlassCard({ totalOwed, youOwe, totalSpent, groupCount }: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1, false
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.card}>
      {/* Dark base */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#1A0A2E', '#0D0D1A', '#12122A']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Spinning glow orb */}
      <Animated.View style={[styles.orb, orbStyle]}>
        <LinearGradient
          colors={['rgba(108,99,255,0.6)', 'rgba(79,158,255,0.3)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Glass border */}
      <LinearGradient
        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']}
        style={styles.glassBorder}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.headerBadge}>
            <TrendingUp color="#FFF" size={14} />
            <Text style={styles.headerBadgeText}>PayBackPal</Text>
          </View>
          <View style={styles.rsBadge}>
            <Text style={styles.rsText}>Rs</Text>
          </View>
        </View>

        {/* Main balance */}
        <Text style={styles.labelSmall}>You're owed</Text>
        <Text style={styles.mainAmount}>{totalOwed}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <CreditCard color="rgba(255,150,100,0.9)" size={13} />
            <View>
              <Text style={styles.statLabel}>You owe</Text>
              <Text style={styles.statValueWarn}>{youOwe}</Text>
            </View>
          </View>
          <View style={styles.statItemSep} />
          <View style={styles.statItem}>
            <TrendingUp color="rgba(108,99,255,0.9)" size={13} />
            <View>
              <Text style={styles.statLabel}>Total spent</Text>
              <Text style={styles.statValue}>{totalSpent}</Text>
            </View>
          </View>
          <View style={styles.statItemSep} />
          <View style={styles.statItem}>
            <Users color="rgba(79,158,255,0.9)" size={13} />
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
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  glassBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
  },
  orb: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -30,
    right: -30,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  rsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108,99,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.6)',
  },
  rsText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },
  labelSmall: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  mainAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
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
  statItemSep: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    letterSpacing: 0.2,
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
