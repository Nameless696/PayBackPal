import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../context/ModalContext';
import { currencies } from '../../constants/currencies';
import type { MainStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, currency, setCurrency, emailAlertsEnabled, setEmailAlerts } = useApp();
  const { openEditProfile } = useModal();

  async function handleLogout() {
    await logout();
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-body">
      <ScrollView>
        {/* Profile */}
        <View className="m-4 bg-bg-card rounded-2xl p-4 flex-row items-center border border-border">
          <View className="w-[52px] h-[52px] rounded-full bg-primary justify-center items-center overflow-hidden" style={{ borderWidth: 2, borderColor: '#D8D5F5' }}>
            {user?.avatar && user.avatar.length > 5 ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text className="text-white text-[22px] font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
            )}
          </View>
          <View className="flex-1 ml-[14px]">
            <Text className="text-text-1 text-base font-bold">{user?.name}</Text>
            <Text className="text-text-muted text-[13px] mt-0.5">{user?.email}</Text>
          </View>
          <TouchableOpacity
            className="rounded-[10px] px-[14px] py-2"
            style={{ backgroundColor: 'rgba(108,99,255,0.15)' }}
            onPress={openEditProfile}>
            <Text className="text-primary font-bold text-[13px]">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text className="text-text-muted text-xs font-semibold ml-5 mb-1.5 tracking-widest uppercase">
          Preferences
        </Text>
        <View className="mx-4 bg-bg-card rounded-2xl p-4 mb-4 border border-border">
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-text-1 text-[15px]">Dark Mode</Text>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: '#6C63FF' }} thumbColor="#FFF" />
          </View>
          <View className="flex-row justify-between items-center py-1 border-t border-border mt-2 pt-3">
            <Text className="text-text-1 text-[15px]">Email Alerts</Text>
            <Switch value={emailAlertsEnabled} onValueChange={setEmailAlerts} trackColor={{ true: '#6C63FF' }} thumbColor="#FFF" />
          </View>
          <View className="border-t border-border mt-2 pt-3">
            <Text className="text-text-1 text-[15px] mb-2.5">Currency</Text>
            <View className="flex-row flex-wrap gap-2">
              {Object.entries(currencies).map(([code, { symbol }]) => (
                <TouchableOpacity
                  key={code}
                  className={`flex-row items-center gap-1 border rounded-[8px] px-2.5 py-1.5 ${
                    currency === code ? 'bg-primary border-primary' : 'border-border'
                  }`}
                  onPress={() => setCurrency(code)}>
                  <Text className={`text-sm font-bold ${currency === code ? 'text-white' : 'text-text-2'}`}>
                    {symbol}
                  </Text>
                  <Text className={`text-xs ${currency === code ? 'text-white' : 'text-text-muted'}`}>
                    {code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Account */}
        <Text className="text-text-muted text-xs font-semibold ml-5 mb-1.5 tracking-widest uppercase">
          Account
        </Text>
        <View className="mx-4 bg-bg-card rounded-2xl p-4 mb-4 border border-border">
          {[
            { label: 'Receipt Storage', icon: '🧾', onPress: () => navigation.navigate('ReceiptStorage') },
            { label: 'Reports',         icon: '📊', onPress: () => navigation.navigate('Reports') },
            { label: 'Change Password', icon: '🔐', onPress: () => Alert.alert('Restricted', 'Changing passwords is bound to the backend. In local MVP mode, please create a new physical account.') },
          ].map(({ label, icon, onPress }) => (
            <TouchableOpacity key={label} className="flex-row items-center py-3 border-t border-border" onPress={onPress}>
              <Text className="text-xl mr-3">{icon}</Text>
              <Text className="flex-1 text-text-1 text-[15px]">{label}</Text>
              <Text className="text-text-muted text-xl">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="mx-4 rounded-[14px] py-4 items-center border mb-0"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }}
          onPress={handleLogout}>
          <Text className="text-error font-bold text-base">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-text-muted text-xs pb-6 mt-4">
          PayBackPal v3.0 · React Native
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
