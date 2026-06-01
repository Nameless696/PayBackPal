import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, RefreshControl, Animated, Easing, StatusBar, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import { calculateBalances } from '../../utils/calculations';
import { getCategoryIcon } from '../../constants/categories';
import type { MainStackParamList } from '../../navigation/types';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedPressable from '../../components/ui/AnimatedPressable';
import { Users, Plus, Bell } from 'lucide-react-native';
import FeatureTour from '../../components/FeatureTour';
import { useTour } from '../../hooks/useTour';
import { minimizeTransactions } from '../../utils/calculations';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { syncAll, groups, expenses, isSyncing, fmt, unreadCount, currencySymbol } = useApp();
  const { openCreateGroup, openAddExpense } = useModal();
  const { tourVisible, dismissTour, recheckTour } = useTour();
  const [refreshing, setRefreshing] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good morning', emoji: '☀️' };
    if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
    if (h < 21) return { text: 'Good evening', emoji: '🌙' };
    return { text: 'Good night', emoji: '✨' };
  };
  const greeting = getGreeting();

  // Bell pulse animation
  const bellPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bellPulse, { toValue: 1.2, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bellPulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      bellPulse.setValue(1);
    }
  }, [unreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) await syncAll(user);
    setRefreshing(false);
  }, [user, syncAll]);

  // Re-check tour whenever screen regains focus (picks up App Feature Guide reset from Settings)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) { isFirstFocus.current = false; return; }
      recheckTour();
    }, [recheckTour])
  );

  useEffect(() => {
    if (user) syncAll(user);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const userId   = user?.id ?? '';
  const balances = useMemo(() => calculateBalances(expenses, userId), [expenses, userId]);
  const activeGroups = useMemo(() => groups.filter(g => !g.isArchived).slice(0, 4), [groups]);
  const recentActivity = useMemo(() => [...expenses]
    .filter(e => !e.isSettlement)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5), [expenses]);

  // Contextual: find top debt the user owes (for settle prompt)
  const topDebt = useMemo(() => {
    for (const group of activeGroups) {
      const gExp = expenses.filter(e => e.groupId === group.id);
      const memberMap: Record<string, string> = {};
      group.members.forEach(m => { memberMap[m.id] = m.name; });
      const simplified = minimizeTransactions(gExp);
      const myDebt = simplified.transactions.find((t: { from: string; to: string; amount: number }) => t.from === userId);
      if (myDebt && myDebt.amount > 0) {
        return { group, to: memberMap[myDebt.to] || myDebt.to, amount: myDebt.amount };
      }
    }
    return null;
  }, [activeGroups, expenses, userId]);

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
              colors={['#6C63FF']}
              progressBackgroundColor="#1A1A2E"
            />
          }
        >
        {/* ── System Header ─────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity 
              className="w-10 h-10 rounded-full justify-center items-center overflow-hidden border border-border"
              onPress={() => (navigation.navigate as any)('Profile')}
              accessibilityLabel="Open profile"
              accessibilityRole="button"
            >
              {user?.avatar && user.avatar.length > 5 ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text className="text-text-1 text-lg font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
              )}
            </TouchableOpacity>
            {isSyncing && <ActivityIndicator color="#6C63FF" size="small" />}
            <TouchableOpacity
              style={{ position: 'relative', marginLeft: 8, padding: 4 }}
              onPress={() => navigation.navigate('Notifications' as any)}
              accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              accessibilityRole="button"
            >
              <Animated.View style={{ transform: [{ scale: bellPulse }] }}>
                <Bell color={unreadCount > 0 ? '#6C63FF' : '#6B6890'} size={22} />
              </Animated.View>
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
        </View>

        {/* ── Greeting ─────────────────────────────────── */}
        <View className="px-5 pb-1">
          <Text className="text-text-muted text-[13px] font-semibold">{greeting.emoji} {greeting.text},</Text>
          <Text className="text-text-1 text-[22px] font-extrabold">{user?.name?.split(' ')[0] || 'there'}</Text>
        </View>
        
        {/* ── Glassmorphism Hero card ─────────────────────────────── */}
        <View className="px-4 py-2">
           <GlassCard 
              totalOwed={fmt(balances.youAreOwed)} 
              youOwe={fmt(balances.youOwe)} 
              totalSpent={fmt(balances.totalExpenses ?? 0)}
              groupCount={groups.filter(g => !g.isArchived).length}
              currencySymbol={currencySymbol}
            />
        </View>

        <View className="p-4">
          <View className="flex-row gap-3">
            <AnimatedPressable style={{ flex: 1 }} onPress={openCreateGroup} accessibilityLabel="Create new group">
              <LinearGradient colors={['#1e1b4b', '#312e81']} style={{ borderRadius: 16, padding: 16, alignItems: 'center' }}>
                <View className="w-11 h-11 rounded-full justify-center items-center mb-2" style={{ backgroundColor: 'rgba(108,99,255,0.25)' }}>
                  <Users color="#A5B4FC" size={22} />
                </View>
                <Text style={{ color: '#E0E7FF', fontSize: 13, fontWeight: '700' }}>New Group</Text>
              </LinearGradient>
            </AnimatedPressable>
            <AnimatedPressable style={{ flex: 1 }} onPress={() => openAddExpense()} accessibilityLabel="Add new expense">
              <LinearGradient colors={['#1e3a5f', '#1e40af']} style={{ borderRadius: 16, padding: 16, alignItems: 'center' }}>
                <View className="w-11 h-11 rounded-full justify-center items-center mb-2" style={{ backgroundColor: 'rgba(79,158,255,0.25)' }}>
                  <Plus color="#93C5FD" size={24} />
                </View>
                <Text style={{ color: '#DBEAFE', fontSize: 13, fontWeight: '700' }}>Add Expense</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </View>

        {/* ── Contextual Settle Prompt ──────────────── */}
        {topDebt && (
          <AnimatedPressable
            style={{ marginHorizontal: 16, marginBottom: 8 }}
            onPress={() => navigation.navigate('GroupDetails', { groupId: topDebt.group.id })}
            accessibilityLabel={`You owe ${fmt(topDebt.amount)} to ${topDebt.to}. Tap to settle.`}
          >
            <LinearGradient
              colors={['#7c2d12', '#9a3412']}
              style={{ borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' }}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={{ fontSize: 22, marginRight: 12 }}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FED7AA', fontSize: 12, fontWeight: '600' }}>You owe {topDebt.to}</Text>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{fmt(topDebt.amount)}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Settle →</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>
        )}

        {/* ── Groups ────────────────────────────────── */}
        <View className="px-4 pb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-text-1 text-[17px] font-bold">Your Groups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Groups' as any)}>
              <Text className="text-primary text-[13px] font-semibold">See All</Text>
            </TouchableOpacity>
          </View>
          {activeGroups.length === 0 ? (
            <View className="bg-bg-card rounded-xl p-5 items-center">
              <Text style={{ fontSize: 40, marginBottom: 8 }}>👥</Text>
              <Text className="text-text-muted text-sm">No groups yet — create one!</Text>
            </View>
          ) : activeGroups.map(group => {
            const groupTotal = expenses.filter(e => e.groupId === group.id && !e.isSettlement).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            return (
            <TouchableOpacity
              key={group.id}
              className="bg-bg-card rounded-[16px] p-[14px] flex-row items-center mb-2 border border-border"
              onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
              activeOpacity={0.8}
            >
              <View className="w-11 h-11 bg-primary/20 rounded-[14px] justify-center items-center overflow-hidden mr-3">
                {group.iconType === 'image' && group.icon && group.icon.length > 5 ? (
                  <Image source={{ uri: group.icon }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text className="text-xl">{group.icon || '👥'}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-text-1 text-[15px] font-bold">{group.name}</Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''} · {fmt(groupTotal)}
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(108,99,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: '#6C63FF', fontSize: 16, fontWeight: '700' }}>›</Text>
              </View>
            </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Recent activity ───────────────────────── */}
        <View className="px-4 pb-8">
          <Text className="text-text-1 text-[17px] font-bold mb-3">Recent Activity</Text>
          {recentActivity.length === 0 ? (
            <View className="bg-bg-card rounded-xl p-5 items-center">
              <Text className="text-text-muted text-sm">No expenses yet</Text>
            </View>
          ) : recentActivity.map(exp => (
            <View key={exp.id} className="flex-row items-center py-2.5 border-b border-border">
              <Text className="text-2xl mr-3">{getCategoryIcon(exp.category, exp.customCategoryIcon)}</Text>
              <View className="flex-1">
                <Text className="text-text-1 text-sm font-semibold">{exp.description}</Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  {exp.group ?? ''} · {new Date(exp.date).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-success text-sm font-bold">{fmt(exp.amount)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Feature Tour (first-launch & Settings re-launch) ── */}
      <FeatureTour visible={tourVisible} onDismiss={dismissTour} />
    </SafeAreaView>
  );
}
