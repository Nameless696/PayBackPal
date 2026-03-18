import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  return (
    <View className="flex-1 bg-bg-body justify-center items-center">
      <Text className="text-[64px] mb-4">💸</Text>
      <Text className="text-[32px] font-extrabold text-text-1 tracking-wide">PayBackPal</Text>
      <Text className="text-base text-text-2 mt-2">Split Expenses, Stay Friends</Text>
      <ActivityIndicator color="#6C63FF" size="large" style={{ marginTop: 40 }} />
    </View>
  );
}
