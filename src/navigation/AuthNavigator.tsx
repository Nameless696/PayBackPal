import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';

import SplashScreen      from '../screens/auth/SplashScreen';
import Onboarding1Screen from '../screens/auth/Onboarding1Screen';
import Onboarding2Screen from '../screens/auth/Onboarding2Screen';
import Onboarding3Screen from '../screens/auth/Onboarding3Screen';
import LoginScreen       from '../screens/auth/LoginScreen';
import SignupScreen      from '../screens/auth/SignupScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Splash"       component={SplashScreen} />
      <Stack.Screen name="Onboarding1"  component={Onboarding1Screen} />
      <Stack.Screen name="Onboarding2"  component={Onboarding2Screen} />
      <Stack.Screen name="Onboarding3"  component={Onboarding3Screen} />
      <Stack.Screen name="Login"        component={LoginScreen} />
      <Stack.Screen name="Signup"       component={SignupScreen} />
      <Stack.Screen name="VerifyEmail"  component={VerifyEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
