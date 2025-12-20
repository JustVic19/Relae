import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './theme/ThemeContext';
import FeedScreen from './screens/FeedScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FeedScreen />
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
