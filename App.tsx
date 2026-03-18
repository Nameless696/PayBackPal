import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ModalProvider } from './src/context/ModalContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <AuthProvider>
        <AppProvider>
          <ModalProvider>
            <RootNavigator />
            <Toast />
          </ModalProvider>
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
