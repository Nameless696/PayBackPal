import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import { useModal } from '../context/ModalContext';

import DashboardScreen     from '../screens/main/DashboardScreen';
import GroupsScreen        from '../screens/main/GroupsScreen';
import FinanceScreen       from '../screens/main/FinanceScreen';
import ProfileScreen       from '../screens/main/ProfileScreen';
import { Home, Users, Plus, Wallet, User } from 'lucide-react-native';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator<TabParamList>();

function EmptyScreen() { return <View style={{ flex: 1, backgroundColor: '#0F0F1A' }} />; }

function FabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.fab} activeOpacity={0.85} accessibilityLabel="Add new expense" accessibilityRole="button">
      <Text style={styles.fabIcon}>＋</Text>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  const { openAddExpense } = useModal();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#6B6890',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
      }}>
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Home color={color} size={24} />, tabBarAccessibilityLabel: 'Home tab' }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{ tabBarLabel: 'Groups', tabBarIcon: ({ color }) => <Users color={color} size={24} />, tabBarAccessibilityLabel: 'Groups tab' }}
      />
      <Tab.Screen
        name="FAB"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: () => <FabButton onPress={() => openAddExpense()} />,
        }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceScreen}
        options={{
          tabBarLabel: 'Finance',
          tabBarIcon: ({ color }) => <Wallet color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <User color={color} size={24} />, tabBarAccessibilityLabel: 'Profile tab' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 70,
    paddingTop: 12,
    paddingBottom: 10,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 35,
    elevation: 0,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center', alignItems: 'center',
    position: 'absolute',
    top: -24, 
    left: '50%',
    marginLeft: -30,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#0F0F1A'
  },
  fabIcon: { color: '#FFF', fontSize: 32, fontWeight: '300', lineHeight: 36, marginTop: -2 },
});
