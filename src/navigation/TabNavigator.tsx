import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import { useApp } from '../context/AppContext';
import { useModal } from '../context/ModalContext';

import DashboardScreen     from '../screens/main/DashboardScreen';
import GroupsScreen        from '../screens/main/GroupsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SettingsScreen      from '../screens/main/SettingsScreen';

import { Text } from 'react-native';

const Tab = createBottomTabNavigator<TabParamList>();

function EmptyScreen() { return <View style={{ flex: 1, backgroundColor: '#0F0F1A' }} />; }

function FabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.fab} activeOpacity={0.85}>
      <Text style={styles.fabIcon}>＋</Text>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  const { unreadCount } = useApp();
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
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{ tabBarLabel: 'Groups', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text> }}
      />
      <Tab.Screen
        name="FAB"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: () => <FabButton onPress={openAddExpense} />,
        }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tab.Screen
        name="Alerts"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔔</Text>,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A2E',
    borderTopColor: '#2D2B45',
    borderTopWidth: 1,
    height: 64,
    paddingTop: 8,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { color: '#FFF', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
