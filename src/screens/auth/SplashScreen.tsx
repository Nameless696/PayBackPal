import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    // If rendered as a route screen, auto-transition after 1.5 seconds!
    if (navigation) {
      const timer = setTimeout(() => {
        navigation.replace('Onboarding1');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [navigation]);

  return (
    <View className="flex-1 bg-bg-body justify-center items-center">
      <Text className="text-[64px] mb-4">💸</Text>
      <Text className="text-[32px] font-extrabold text-text-1 tracking-wide">PayBackPal</Text>
      <Text className="text-base text-text-2 mt-2">Split Expenses, Stay Friends</Text>
      <ActivityIndicator color="#6C63FF" size="large" style={{ marginTop: 40 }} />
    </View>
  );
}
