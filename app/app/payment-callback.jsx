import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { usePaymentStore } from '../store/paymentStore';
import { Colors } from '../constants/colors';

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { theme, isDarkMode } = useThemeStore();
  const { verifyPayment } = usePaymentStore();

  const reference = params?.reference || params?.trxref || '';
  const initialStatus = params?.status || '';

  const [verificationState, setVerificationState] = useState(
    initialStatus === 'COMPLETED' ? 'success' : 'loading'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedOrder, setVerifiedOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function handleVerify() {
      if (!reference) {
        if (isMounted) {
          setVerificationState(initialStatus === 'COMPLETED' ? 'success' : 'failed');
          setErrorMessage('No payment reference found in redirect callback.');
        }
        return;
      }

      try {
        setVerificationState('loading');
        const result = await verifyPayment(reference);
        if (!isMounted) return;

        if (result?.success || initialStatus === 'COMPLETED') {
          setVerificationState('success');
          setVerifiedOrder(result?.order || null);
        } else {
          setVerificationState('failed');
          setErrorMessage(result?.error || 'Payment verification could not be confirmed.');
        }
      } catch (err) {
        if (!isMounted) return;
        if (initialStatus === 'COMPLETED') {
          setVerificationState('success');
        } else {
          setVerificationState('failed');
          setErrorMessage(err?.message || 'Network error verifying transaction.');
        }
      }
    }

    handleVerify();

    return () => {
      isMounted = false;
    };
  }, [reference, initialStatus]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={[styles.contentWrap, { paddingTop: topInset + 20 }]}>
        {verificationState === 'loading' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Verifying Payment
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Please hold on while we confirm your transaction with Paystack...
            </Text>
            {reference ? (
              <View style={[styles.refBadge, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.refText, { color: theme.textSecondary }]}>
                  Ref: {reference}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {verificationState === 'success' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="check-decagram" size={64} color="#10b981" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Payment Confirmed!
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Your transaction was processed successfully and your learning pass has been activated.
            </Text>

            {reference ? (
              <View style={[styles.refBadge, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.refText, { color: theme.textSecondary }]}>
                  Reference: {reference}
                </Text>
              </View>
            ) : null}

            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary || '#005D4B' }]}
                onPress={() => router.replace('/(main)')}
                activeOpacity={0.85}
              >
                <Ionicons name="home-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Go to Home Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => router.replace('/(profile)/premium')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="crown-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>View My Passes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {verificationState === 'failed' && (
          <View style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Verification Pending
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {errorMessage || 'We could not automatically verify this payment reference right now.'}
            </Text>

            <View style={styles.actionGroup}>
              {reference ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.primary || '#005D4B' }]}
                  onPress={async () => {
                    setVerificationState('loading');
                    const res = await verifyPayment(reference);
                    if (res?.success) {
                      setVerificationState('success');
                    } else {
                      setVerificationState('failed');
                      setErrorMessage(res?.error || 'Verification check failed.');
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Retry Verification</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => router.replace('/(profile)/premium')}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back-outline" size={18} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Return to Premium Screen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Ubuntu-Bold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Ubuntu-Regular',
  },
  refBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 28,
  },
  refText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionGroup: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
