import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import { calculateBalances } from '../../utils/calculations';
import { getCategoryIcon } from '../../constants/categories';
import type { MainStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { syncAll, groups, expenses, isSyncing, fmt } = useApp();
  const { openCreateGroup, openAddExpense } = useModal();

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
      <ScrollView>
        {/* ── Hero card ─────────────────────────────── */}
        <LinearGradient colors={['#6C63FF', '#4F9EFF']} style={{ padding: 24, paddingBottom: 32 }}>
          <View className="flex-row justify-between items-center mb-4">
            <View className="w-10 h-10 rounded-full justify-center items-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text className="text-white text-lg font-bold">{user?.avatar ?? '?'}</Text>
            </View>
            {isSyncing && <ActivityIndicator color="#FFF" size="small" />}
          </View>
          <Text className="text-white/80 text-[13px]">Total You're Owed</Text>
          <Text className="text-white text-[36px] font-extrabold mb-4">{fmt(balances.youAreOwed)}</Text>

          <View className="flex-row rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <View className="flex-1 items-center">
              <Text className="text-white/70 text-[11px] mb-1">You Owe</Text>
              <Text className="text-[15px] font-bold" style={{ color: '#FFA07A' }}>{fmt(balances.youOwe)}</Text>
            </View>
            <View className="w-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <View className="flex-1 items-center">
              <Text className="text-white/70 text-[11px] mb-1">Total Spent</Text>
              <Text className="text-white text-[15px] font-bold">{fmt(balances.totalExpenses ?? 0)}</Text>
            </View>
            <View className="w-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <View className="flex-1 items-center">
              <Text className="text-white/70 text-[11px] mb-1">Groups</Text>
              <Text className="text-white text-[15px] font-bold">
                {groups.filter(g => !g.isArchived).length}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick actions ─────────────────────────── */}
        <View className="p-4">
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-bg-card rounded-[14px] p-4 items-center border border-border" onPress={openCreateGroup}>
              <Text className="text-[28px] mb-2">👥</Text>
              <Text className="text-text-1 text-[13px] font-semibold">New Group</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-bg-card rounded-[14px] p-4 items-center border border-border" onPress={() => openAddExpense()}>
              <Text className="text-[28px] mb-2">➕</Text>
              <Text className="text-text-1 text-[13px] font-semibold">Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Groups ────────────────────────────────── */}
        <View className="px-4 pb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-text-1 text-[17px] font-bold">Your Groups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs' as any)}>
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
              <Text className="text-2xl mr-3">{group.iconType === 'emoji' ? group.icon : '👥'}</Text>
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
    </SafeAreaView>
  );
}
