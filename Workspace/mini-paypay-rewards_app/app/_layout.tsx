import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import 'react-native-reanimated';

import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapAuth } from '@/store/authSlice';

function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { token, bootstrapped } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!bootstrapped) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [bootstrapped, token, segments, router]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

const AppLightTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FBF8FF' },
};

const AppDarkTheme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#FBF8FF' },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <SafeAreaProvider style={{ backgroundColor: '#FBF8FF' }}>
        <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FBF8FF' },
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </AuthGate>
          <StatusBar style="dark" />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
