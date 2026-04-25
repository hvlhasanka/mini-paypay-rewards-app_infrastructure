import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type AlertKind = 'success' | 'error' | 'warning';

interface AlertModalProps {
  visible: boolean;
  kind: AlertKind;
  title: string;
  message?: string;
  actionLabel?: string;
  onClose: () => void;
}

const VARIANTS: Record<
  AlertKind,
  { icon: keyof typeof Ionicons.glyphMap; tint: string; badge: string }
> = {
  success: { icon: 'checkmark-circle', tint: '#0F9D58', badge: '#E6F6EC' },
  error: { icon: 'close-circle', tint: '#DC2626', badge: '#FDECEC' },
  warning: { icon: 'warning', tint: '#F59E0B', badge: '#FEF3DC' },
};

export default function AlertModal({
  visible,
  kind,
  title,
  message,
  actionLabel = 'OK',
  onClose,
}: AlertModalProps) {
  const v = VARIANTS[kind];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color="#464653" />
          </Pressable>
          <View style={[styles.iconWrap, { backgroundColor: v.badge }]}>
            <Ionicons name={v.icon} size={36} color={v.tint} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable style={[styles.button, { backgroundColor: v.tint }]} onPress={onClose}>
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00003C66',
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingBottom: 45,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#E5E7EB',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: '#00003C',
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#464653',
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 35,
    paddingVertical: 15,
    borderRadius: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Manrope',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
