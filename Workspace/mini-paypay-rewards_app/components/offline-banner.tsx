import { Ionicons } from '@expo/vector-icons';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnlineStatus } from '@/hooks/use-online-status';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
const EXTRA_TOP = 5;

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { paddingTop: ANDROID_STATUS_BAR + EXTRA_TOP }]}
    >
      <View style={styles.row}>
        <Ionicons name="cloud-offline" size={14} color="#FFFFFF" />
        <Text style={styles.text}>You&apos;re offline. Please reconnect to continue.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#BA1A1A' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
