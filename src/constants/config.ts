import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.select({
    android: 'http://10.0.2.2:5000/api',
    ios: 'http://localhost:5000/api',
  }) ?? 'http://localhost:5000/api';
