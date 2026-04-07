import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import type { MainStackParamList } from '../../navigation/types';
import PerformanceBox from '../../components/ui/PerformanceBox';
import LinearGradient from 'react-native-linear-gradient';
import { Receipt, BarChart2, Settings, LogOut, ChevronRight } from 'lucide-react-native';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { groups, expenses, fmt } = useApp();
  const { openEditProfile } = useModal();

  // Basic Stats
  const stats = useMemo(() => {
    const totalSpent = expenses
      .filter(e => e.paidBy === user?.id && !e.isSettlement && !e.isContribution)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return {
      totalSpent,
      groupsActive: groups.length
    };
  }, [expenses, groups, user?.id]);

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-white text-3xl font-bold">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Profile Card */}
        <View className="m-4 mt-2 bg-bg-card rounded-2xl p-5 border border-border items-center">
          <View className="w-[80px] h-[80px] rounded-full bg-primary justify-center items-center overflow-hidden mb-4" style={{ borderWidth: 3, borderColor: '#D8D5F5' }}>
            {user?.avatar && user.avatar.length > 5 ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text className="text-white text-[32px] font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
            )}
          </View>
          <Text className="text-text-1 text-xl font-bold">{user?.name}</Text>
          <Text className="text-text-muted text-[14px] mt-1 mb-4">{user?.email}</Text>
          
          <TouchableOpacity
            style={styles.editBtn}
            onPress={openEditProfile}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats analytics */}
        <View className="mx-4 mb-4 mt-2">
          <PerformanceBox
            totalSpent={stats.totalSpent}
            groupsActive={stats.groupsActive}
            fmt={fmt}
            onPressReports={() => navigation.navigate('Reports')}
          />
        </View>



        {/* Ledger & Tools */}
        <Text className="text-text-muted text-xs font-semibold ml-5 mb-2 tracking-widest uppercase mt-2">Ledger & Data</Text>
        <View className="mx-4 bg-bg-card rounded-2xl mb-4 border border-border overflow-hidden">
          {[
            { label: 'Receipt Storage', Icon: Receipt, onPress: () => navigation.navigate('ReceiptStorage') },
            { label: 'Analytics & Reports', Icon: BarChart2, onPress: () => navigation.navigate('Reports') },
          ].map(({ label, Icon, onPress }, i) => (
            <TouchableOpacity key={label} className={`flex-row items-center px-4 py-4 ${i !== 0 ? 'border-t border-border' : ''}`} onPress={onPress}>
              <View style={styles.iconWrap}>
                <Icon color="#6C63FF" size={16} />
              </View>
              <Text className="flex-1 text-text-1 text-base font-semibold ml-3">{label}</Text>
              <ChevronRight color="#6B6890" size={18} />
            </TouchableOpacity>
          ))}
        </View>

        {/* System & Authentication */}
        <Text className="text-text-muted text-xs font-semibold ml-5 mb-2 tracking-widest uppercase">System</Text>
        <View className="mx-4 bg-bg-card rounded-2xl mb-4 border border-border overflow-hidden">
          <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-border" onPress={() => (navigation.navigate as any)('Settings')}>
            <View style={styles.iconWrap}>
              <Settings color="#6C63FF" size={16} />
            </View>
            <Text className="flex-1 text-text-1 text-base font-semibold ml-3">App Settings</Text>
            <ChevronRight color="#6B6890" size={18} />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center px-4 py-4" onPress={logout}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <LogOut color="#EF4444" size={16} />
            </View>
            <Text className="flex-1 text-error text-base font-bold ml-3">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-text-muted text-xs pb-10 mt-2">PayBackPal v3.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = require('react-native').StyleSheet.create({
  editBtn: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  editBtnText: {
    color: '#6C63FF',
    fontWeight: '700',
    fontSize: 14,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(108,99,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
