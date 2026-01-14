import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryProvider } from './contexts/QueryProvider';
import HomeScreen from './screens/HomeScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import OnboardingContainer from './screens/OnboardingContainer';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import { setupDeepLinking, cleanupDeepLinking } from './lib/deepLinking';

const Stack = createNativeStackNavigator();

// Main app navigation that responds to auth state
function AppNavigator() {
  const { user, initializing } = useAuth();

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
        // Authenticated stack - HomeScreen is the main screen
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ animation: 'fade' }}
        />
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

export default function App() {
  return (
    <SafeAreaProvider>
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
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

