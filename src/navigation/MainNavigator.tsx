import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';

import TabNavigator        from './TabNavigator';
import GroupDetailsScreen  from '../screens/sub/GroupDetailsScreen';
import ReceiptStorageScreen from '../screens/sub/ReceiptStorageScreen';
import ReportsScreen        from '../screens/sub/ReportsScreen';
import SettingsScreen       from '../screens/main/SettingsScreen';
import NotificationsScreen  from '../screens/main/NotificationsScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs"           component={TabNavigator} />
      <Stack.Screen name="GroupDetails"   component={GroupDetailsScreen} />
      <Stack.Screen name="ReceiptStorage" component={ReceiptStorageScreen} />
      <Stack.Screen name="Reports"        component={ReportsScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}
