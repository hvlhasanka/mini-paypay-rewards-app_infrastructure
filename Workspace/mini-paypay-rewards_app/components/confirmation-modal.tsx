import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

export type ConfirmationStatus = 'confirm' | 'loading' | 'success' | 'error';

interface ConfirmationModalProps {
  visible: boolean;
  status: ConfirmationStatus;

  // Confirm state
  title: string;
  message?: string;
  heroImage?: ImageSourcePropType | null;
  detailLabel?: string;
  detailValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;

  // Success state
  successTitle?: string;
  successMessage?: string;
  successActionLabel?: string;
  successDetailLabel?: string;
  successDetailValue?: string;

  // Error state
  errorTitle?: string;
  errorMessage?: string;
  errorActionLabel?: string;

  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  visible,
  status,
  title,
  message,
  heroImage,
  detailLabel,
  detailValue,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  successTitle = 'Done',
  successMessage,
  successActionLabel = 'Done',
  successDetailLabel,
  successDetailValue,
  errorTitle = 'Something went wrong',
  errorMessage,
  errorActionLabel = 'Close',
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={isLoading ? undefined : onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={isLoading ? undefined : onClose}
      >
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {isSuccess ? (
            <>
              <View style={[styles.iconWrap, { backgroundColor: '#E6F6EC' }]}>
                <Ionicons name="checkmark-circle" size={40} color="#0F9D58" />
              </View>
              <Text style={styles.title}>{successTitle}</Text>
              {successMessage ? (
                <Text style={styles.message}>{successMessage}</Text>
              ) : null}
              {successDetailLabel || successDetailValue ? (
                <View style={styles.detailRow}>
                  {successDetailLabel ? (
                    <Text style={styles.detailLabel}>{successDetailLabel}</Text>
                  ) : null}
                  {successDetailValue ? (
                    <Text style={styles.detailValue}>{successDetailValue}</Text>
                  ) : null}
                </View>
              ) : null}
              <Pressable
                style={[styles.button, { backgroundColor: '#00003C' }]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>{successActionLabel}</Text>
              </Pressable>
            </>
          ) : isError ? (
            <>
              <View style={[styles.iconWrap, { backgroundColor: '#FDECEC' }]}>
                <Ionicons name="close-circle" size={40} color="#DC2626" />
              </View>
              <Text style={styles.title}>{errorTitle}</Text>
              {errorMessage ? (
                <Text style={styles.message}>{errorMessage}</Text>
              ) : null}
              <Pressable
                style={[styles.button, { backgroundColor: '#DC2626' }]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>{errorActionLabel}</Text>
              </Pressable>
            </>
          ) : (
            <>
              {heroImage ? (
                <Image
                  source={heroImage}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={styles.title}>{title}</Text>
              {message ? (
                <Text style={styles.message} numberOfLines={3}>
                  {message}
                </Text>
              ) : null}
              {detailLabel || detailValue ? (
                <View style={styles.detailRow}>
                  {detailLabel ? (
                    <Text style={styles.detailLabel}>{detailLabel}</Text>
                  ) : null}
                  {detailValue ? (
                    <Text style={styles.detailValue}>{detailValue}</Text>
                  ) : null}
                </View>
              ) : null}
              <Pressable
                style={[styles.button, { backgroundColor: '#00003C' }]}
                disabled={isLoading}
                onPress={onConfirm}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>{confirmLabel}</Text>
                )}
              </Pressable>
              {!isLoading ? (
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>{cancelLabel}</Text>
                </Pressable>
              ) : null}
            </>
          )}
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
    paddingHorizontal: 16,
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
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 16,
    backgroundColor: '#E7E4EE',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: '#00003C',
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#464653',
    textAlign: 'center',
  },
  detailRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F2FC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#464653',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: 'Manrope',
    fontWeight: '800',
    fontSize: 18,
    color: '#00003C',
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
  cancelButton: {
    paddingVertical: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#464653',
  },
});
