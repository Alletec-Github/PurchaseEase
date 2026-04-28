import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/config/theme';

const AUTH_KEY = '@PurchaseEase:isLoggedIn';

export default function App(): React.JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((value) => {
      setIsLoggedIn(value === 'true');
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <></>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <AppNavigator isLoggedIn={isLoggedIn} />
    </GestureHandlerRootView>
  );
}
