import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, RefreshControl } from 'react-native';
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
import { Users, Plus } from 'lucide-react-native';
import FeatureTour from '../../components/FeatureTour';
import { useTour } from '../../hooks/useTour';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { syncAll, groups, expenses, isSyncing, fmt } = useApp();
  const { openCreateGroup, openAddExpense } = useModal();
  const { tourVisible, dismissTour, recheckTour } = useTour();
  const [refreshing, setRefreshing] = useState(false);

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
  const balances = calculateBalances(expenses, userId);
  const activeGroups = groups.filter(g => !g.isArchived).slice(0, 4);
  const recentActivity = [...expenses]
    .filter(e => !e.isSettlement)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
        <View className="px-5 pt-4 pb-2 flex-row justify-between items-center bg-bg-body">
            <TouchableOpacity 
              className="w-10 h-10 rounded-full justify-center items-center overflow-hidden border border-border"
              onPress={() => (navigation.navigate as any)('Profile')}
            >
              {user?.avatar && user.avatar.length > 5 ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text className="text-text-1 text-lg font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
              )}
            </TouchableOpacity>
            {isSyncing && <ActivityIndicator color="#6C63FF" size="small" />}
        </View>
        
        {/* ── Glassmorphism Hero card ─────────────────────────────── */}
        <View className="px-4 py-2">
           <GlassCard 
              totalOwed={fmt(balances.youAreOwed)} 
              youOwe={fmt(balances.youOwe)} 
              totalSpent={fmt(balances.totalExpenses ?? 0)}
              groupCount={groups.filter(g => !g.isArchived).length}
            />
        </View>

        {/* ── Quick actions ─────────────────────────── */}
        <View className="p-4">
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-bg-card rounded-[14px] p-4 items-center border border-border" onPress={openCreateGroup}>
              <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mb-2">
                <Users color="#6C63FF" size={20} />
              </View>
              <Text className="text-text-1 text-[13px] font-semibold">New Group</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-bg-card rounded-[14px] p-4 items-center border border-border" onPress={() => openAddExpense()}>
              <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mb-2">
                <Plus color="#6C63FF" size={22} />
              </View>
              <Text className="text-text-1 text-[13px] font-semibold">Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

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
              <Text className="text-text-muted text-sm">No groups yet — create one!</Text>
            </View>
          ) : activeGroups.map(group => (
            <TouchableOpacity
              key={group.id}
              className="bg-bg-card rounded-xl p-[14px] flex-row items-center mb-2 border border-border"
              onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}>
              <View className="w-10 h-10 bg-primary/20 rounded-lg justify-center items-center overflow-hidden mr-3">
                {group.iconType === 'image' && group.icon && group.icon.length > 5 ? (
                  <Image source={{ uri: group.icon }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text className="text-xl">{group.icon || '👥'}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-text-1 text-[15px] font-semibold">{group.name}</Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text className="text-text-muted text-xl">›</Text>
            </TouchableOpacity>
          ))}
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
