import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TrendingUp, ChevronRight, Users, Zap } from 'lucide-react-native';

interface Props {
  totalSpent: number;
  groupsActive: number;
  fmt: (n: number) => string;
  onPressReports?: () => void;
}

const BAR_DATA = [40, 65, 45, 80, 55, 90, 70];

export default function PerformanceBox({ totalSpent, groupsActive, fmt, onPressReports }: Props) {
  return (
    <View style={styles.container}>
      {/* Subtle gradient overlay */}
      <LinearGradient
        colors={['rgba(108,99,255,0.08)', 'rgba(79,158,255,0.04)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={styles.iconBadge}>
            <TrendingUp color="#FFF" size={14} />
          </LinearGradient>
          <Text style={styles.headerTitle}>My Analytics</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Zap color="#6C63FF" size={16} style={{ marginBottom: 6 }} />
          <Text style={styles.statLabel}>Total Paid</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(totalSpent)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Users color="#4F9EFF" size={16} style={{ marginBottom: 6 }} />
          <Text style={styles.statLabel}>Active Groups</Text>
          <Text style={[styles.statValue, { color: '#4F9EFF' }]}>{groupsActive}</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={styles.chartContainer}>
        {BAR_DATA.map((pct, i) => (
          <View key={i} style={styles.barTrack}>
            <LinearGradient
              colors={['#6C63FF', '#4F9EFF']}
              style={[styles.barFill, { height: `${pct}%` }]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
            />
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Last 7 days</Text>
        <TouchableOpacity style={styles.viewBtn} onPress={onPressReports}>
          <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={styles.viewBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.viewBtnText}>Reports</Text>
            <ChevronRight color="#FFF" size={12} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
    padding: 16,
    backgroundColor: 'rgba(26,26,46,0.6)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F1F0FF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  liveText: { color: '#34D399', fontSize: 11, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  statLabel: {
    color: '#6B6890',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#6C63FF',
    fontSize: 18,
    fontWeight: '800',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  barTrack: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: { color: '#6B6890', fontSize: 12, fontWeight: '500' },
  viewBtn: { borderRadius: 10, overflow: 'hidden' },
  viewBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  viewBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});
