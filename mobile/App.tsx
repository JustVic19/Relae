import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryProvider } from './contexts/QueryProvider';
import HomeScreen from './screens/HomeScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import OnboardingContainer from './screens/OnboardingContainer';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import CalendarScreen from './screens/CalendarScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import GroupDetailsScreen from './screens/GroupDetailsScreen';
import { setupDeepLinking, cleanupDeepLinking } from './lib/deepLinking';

import { usePushNotifications } from './hooks/usePushNotifications';
import { savePushToken } from './services/api';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import * as Sentry from '@sentry/react-native';
import { Analytics } from './services/analytics';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: __DEV__,
});

const Stack = createNativeStackNavigator();

// Main app navigation that responds to auth state
function AppNavigator() {
  const { user, initializing } = useAuth();
  const { expoPushToken } = usePushNotifications(); // Get token

  // Save token when we have both user and token
  useEffect(() => {
    if (user && expoPushToken) {
      savePushToken(expoPushToken);
    }
  }, [user, expoPushToken]);


  // Set up deep linking for OAuth
  useEffect(() => {
    setupDeepLinking();
    return () => cleanupDeepLinking();
  }, []);

  // Show loading screen while checking auth state
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated stack
        <>
          <Stack.Screen name="Splash">
            {(props) => <SplashScreen {...props} onFinish={() => props.navigation.replace('Main')} />}
          </Stack.Screen>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="GroupDetails"
            component={GroupDetailsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      ) : (
        // Unauthenticated stack
        <>
          <Stack.Screen name="Splash">
            {(props) => <SplashScreen {...props} onFinish={() => props.navigation.replace('Onboarding')} />}
          </Stack.Screen>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingContainer}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function App() {
  useEffect(() => {
    Analytics.init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <SafeAreaProvider>
          <OfflineBanner />
          <AuthProvider>
            <QueryProvider>
              <ThemeProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
                <StatusBar style="auto" />
              </ThemeProvider>
            </QueryProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

