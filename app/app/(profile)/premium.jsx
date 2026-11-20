import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { useThemeStore } from '../../store/themeStore';
import { usePaymentStore } from '../../store/paymentStore';
import { useAuthStore } from '../../store/authStore';

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const {
    products,
    activeEntitlements,
    orders,
    isLoadingProducts,
    isProcessingPayment,
    fetchProducts,
    fetchActiveEntitlements,
    fetchOrders,
    initializePayment,
    verifyPayment,
  } = usePaymentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activePendingRef, setActivePendingRef] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [isVerifyingSelected, setIsVerifyingSelected] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      fetchProducts(),
      fetchActiveEntitlements(),
      fetchOrders(),
    ]);
  };

  const handleVerifySelectedOrder = async (reference) => {
    if (!reference) return;
    setIsVerifyingSelected(true);
    try {
      const res = await verifyPayment(reference);
      if (res?.success) {
        Alert.alert('Payment Confirmed!', 'Your entitlement has been activated successfully.');
        await loadAllData();
        setSelectedOrderForDetail((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
      } else {
        Alert.alert('Status Update', res?.message || 'Payment is still awaiting confirmation from Paystack.');
      }
    } catch (err) {
      Alert.alert('Verification Notice', 'Could not verify payment status at this moment. Please try again later.');
    } finally {
      setIsVerifyingSelected(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Active Semester Pass computation
  const activeSemesterPass = useMemo(() => {
    return activeEntitlements.find(
      (e) => e.featureKey === 'SEMESTER_PREMIUM_ACCESS' && e.status === 'ACTIVE'
    );
  }, [activeEntitlements]);

  // Active Exam Prep Pass computation
  const activeExamPrepPass = useMemo(() => {
    return activeEntitlements.find(
      (e) => e.featureKey === 'EXAM_PREP_ACCESS' && e.status === 'ACTIVE'
    );
  }, [activeEntitlements]);

  // Handle Checkout
  const handlePurchase = async (product) => {
    if (isProcessingPayment) return;

    Alert.alert(
      'Confirm Pass Purchase',
      `You are selecting the ${product.title} for ₦${(product.amount / 100).toLocaleString()}.\n\nThis transaction runs in Paystack secure checkout.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Paystack',
          onPress: async () => {
            const initRes = await initializePayment(product.id);
            if (!initRes.success || !initRes.authorizationUrl) {
              Alert.alert('Checkout Error', initRes.error || 'Failed to initialize checkout with gateway.');
              return;
            }

            const targetRef = initRes.reference;
            setActivePendingRef(targetRef);

            let deepLinkSubscription = null;
            let hasVerified = false;

            const executeVerification = async (refToVerify) => {
              if (hasVerified) return;
              hasVerified = true;

              if (deepLinkSubscription) {
                deepLinkSubscription.remove();
                deepLinkSubscription = null;
              }

              try {
                await WebBrowser.dismissBrowser();
              } catch {}

              const verifyRef = refToVerify || targetRef;
              if (verifyRef) {
                const verifyRes = await verifyPayment(verifyRef);
                if (verifyRes.success) {
                  Alert.alert(
                    'Payment Successful! 🎉',
                    `Your ${product.title} is now active on your account! Your learning materials, mock tests, and AI explanations are unlocked.`
                  );
                  loadAllData();
                } else {
                  Alert.alert(
                    'Payment Verification',
                    'Your payment has been recorded. Tap "Verify Recent Payment" or pull to refresh once completed.'
                  );
                }
              }
            };

            try {
              // 1. Listen for deep-link return from browser / intent (brainbuzz-app:// or brainbuzz://)
              deepLinkSubscription = Linking.addEventListener('url', async (event) => {
                const url = event?.url;
                if (url && (url.includes('payment-callback') || url.includes('reference='))) {
                  try {
                    const parsed = Linking.parse(url);
                    const queryRef = parsed.queryParams?.reference;
                    await executeVerification(queryRef || targetRef);
                  } catch {
                    await executeVerification(targetRef);
                  }
                }
              });

              // 2. Open Paystack Checkout using openAuthSessionAsync
              // Intercepts return to brainbuzz-app://payment-callback and closes the browser automatically
              const authResult = await WebBrowser.openAuthSessionAsync(
                initRes.authorizationUrl,
                'brainbuzz-app://payment-callback',
                {
                  toolbarColor: isDarkMode ? '#0f172a' : '#005D4B',
                  controlsColor: '#ffffff',
                }
              );

              // 3. Process outcome if not already verified via deep link
              if (authResult?.type === 'success' && authResult?.url) {
                const parsed = Linking.parse(authResult.url);
                const queryRef = parsed.queryParams?.reference;
                await executeVerification(queryRef || targetRef);
              } else if (!hasVerified && targetRef) {
                // If user dismissed browser sheet or completed without redirect callback
                await executeVerification(targetRef);
              }
            } catch (err) {
              console.warn('[WebBrowser Error]', err);
              if (!hasVerified && targetRef) {
                await executeVerification(targetRef);
              }
            } finally {
              if (deepLinkSubscription) {
                deepLinkSubscription.remove();
                deepLinkSubscription = null;
              }
            }
          },
        },
      ]
    );
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Premium & Passes</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Optional Student Learning Upgrades</Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="refresh" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.primary || '#005D4B']} tintColor={theme.primary || '#005D4B'} />}
      >
        {/* Educational Equity Guarantee Banner */}
        <View style={[styles.equityCard, { borderColor: isDarkMode ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.2)' }]}>
          <View style={styles.equityHeader}>
            <MaterialCommunityIcons name="shield-check" size={22} color="#4f46e5" />
            <Text style={styles.equityTitle}>Educational Equity Guarantee</Text>
          </View>
          <Text style={[styles.equityText, { color: theme.textSecondary }]}>
            All official course assessments, continuous evaluations, submissions, attendance check-ins, lecturer announcements, and curriculum materials are <Text style={styles.boldText}>100% free forever</Text>. Premium passes are strictly optional for advanced mock tests, AI explanations, and accelerated revision.
          </Text>
        </View>

        {/* Current Active Status Card */}
        <View style={[styles.statusCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: theme.border }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusBadgeRow}>
              <MaterialCommunityIcons
                name={activeSemesterPass ? 'crown' : 'account-check'}
                size={20}
                color={activeSemesterPass ? '#f59e0b' : '#10b981'}
              />
              <Text style={[styles.statusCardTitle, { color: theme.text }]}>
                {activeSemesterPass ? 'Semester Pass Active' : activeExamPrepPass ? 'Exam Prep Pass Active' : 'Free Student Tier'}
              </Text>
            </View>
            <View style={[styles.tierPill, { backgroundColor: activeSemesterPass ? '#fef3c7' : '#e0f2fe' }]}>
              <Text style={[styles.tierPillText, { color: activeSemesterPass ? '#b45309' : '#0369a1' }]}>
                {activeSemesterPass ? 'PREMIUM' : 'STANDARD'}
              </Text>
            </View>
          </View>

          {activeSemesterPass ? (
            <View style={styles.entitlementDetails}>
              <Text style={[styles.sessionText, { color: theme.textSecondary }]}>
                Session: <Text style={[styles.boldText, { color: theme.text }]}>{activeSemesterPass.academicSession || '2026/2027'}</Text> · Semester: <Text style={[styles.boldText, { color: theme.text }]}>{(activeSemesterPass.semester || 'Harmattan').toUpperCase()}</Text>
              </Text>
              <View style={styles.expiryRow}>
                <Ionicons name="time-outline" size={16} color="#4f46e5" />
                <Text style={styles.expiryText}>
                  {activeSemesterPass.remainingDays !== undefined ? `${activeSemesterPass.remainingDays} days remaining` : 'Active for entire semester'}
                </Text>
              </View>
              <View style={styles.unlockedList}>
                <Text style={[styles.unlockedHeader, { color: theme.text }]}>Included Benefits:</Text>
                <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>✓ Unlimited AI-Powered Question Explanations</Text>
                <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>✓ Full-Length Timed Examination Simulations</Text>
                <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>✓ Advanced Performance & Weakness Diagnostics</Text>
                <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>✓ Priority High-Yield Revision Modules</Text>
              </View>

              {/* 1-Tap Direct Benefit Shortcuts */}
              <View style={styles.shortcutsGrid}>
                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', borderColor: theme.border }]}
                  onPress={() => router.push('/(assessments)')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text-outline" size={16} color={theme.primary || '#005D4B'} />
                  <Text style={[styles.shortcutText, { color: theme.text }]}>Study Handouts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', borderColor: theme.border }]}
                  onPress={() => router.push('/(assessments)')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="school-outline" size={16} color={theme.primary || '#005D4B'} />
                  <Text style={[styles.shortcutText, { color: theme.text }]}>Mock CBT Exam</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', borderColor: theme.border }]}
                  onPress={() => router.push('/(assessments)/discussions')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubbles-outline" size={16} color={theme.primary || '#005D4B'} />
                  <Text style={[styles.shortcutText, { color: theme.text }]}>AI Tutor Help</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.freeTierContent}>
              <Text style={[styles.freeTierDesc, { color: theme.textSecondary }]}>
                You have standard free access to all enrolled courses and tests. Upgrade anytime to unlock AI-assisted learning and full CBT exam preparation.
              </Text>
            </View>
          )}

          {activePendingRef && (
            <TouchableOpacity
              style={styles.verifyPendingBtn}
              onPress={() => verifyPayment(activePendingRef)}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.verifyPendingText}>Verify Recent Payment</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Tab Selector */}
        <View style={styles.tabContainer}>
          {['ALL', 'SEMESTER_PASS', 'EXAM_PREP', 'AI_TUTOR'].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.tabBtn,
                selectedCategory === cat && styles.activeTabBtn,
                { borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  selectedCategory === cat ? styles.activeTabBtnText : { color: theme.textSecondary },
                ]}
              >
                {cat === 'ALL' ? 'All Passes' : cat === 'SEMESTER_PASS' ? 'Semester' : cat === 'EXAM_PREP' ? 'Exam Prep' : 'AI Packs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Product Cards List */}
        <View style={styles.productsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Learning Passes</Text>

          {isLoadingProducts ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading available passes...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="tag-off-outline" size={36} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No products found in this category.</Text>
            </View>
          ) : (
            filteredProducts.map((prod) => {
              const isPurchased = activeEntitlements.some(
                (e) =>
                  (e.productId === prod.id || (e.featureKey && e.featureKey === prod.featureKey)) &&
                  e.status === 'ACTIVE'
              );

              return (
                <View
                  key={prod.id}
                  style={[
                    styles.productCard,
                    { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: theme.border },
                  ]}
                >
                  <View style={styles.productHeader}>
                    <View style={styles.productTitleWrap}>
                      <Text style={[styles.productTitle, { color: theme.text }]}>{prod.title}</Text>
                      <Text style={[styles.productDesc, { color: theme.textSecondary }]}>{prod.description}</Text>
                    </View>
                    <View style={styles.priceWrap}>
                      <Text style={styles.priceAmount}>₦{(prod.amount / 100).toLocaleString()}</Text>
                      <Text style={[styles.priceSub, { color: theme.textSecondary }]}>
                        {prod.durationDays ? `${prod.durationDays} days` : 'Per Term'}
                      </Text>
                    </View>
                  </View>

                  {/* Benefits Checklist */}
                  {Array.isArray(prod.benefits) && prod.benefits.length > 0 && (
                    <View style={styles.benefitsBox}>
                      {prod.benefits.map((b, idx) => (
                        <View key={idx} style={styles.benefitRow}>
                          <Ionicons name="checkmark-circle" size={15} color="#10b981" />
                          <Text style={[styles.benefitRowText, { color: theme.text }]}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Purchase CTA */}
                  {isPurchased ? (
                    <View style={styles.purchasedActionRow}>
                      <View style={[styles.purchaseBtn, styles.purchasedBtn, { flex: 1, flexDirection: 'row', gap: 6 }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                        <Text style={styles.purchaseBtnText}>Active Pass</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.purchaseBtn, { flex: 1.25, backgroundColor: theme.primary || '#005D4B' }]}
                        onPress={() => router.push('/(assessments)')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.purchaseBtnText}>Access Benefits ➔</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.purchaseBtn,
                        isProcessingPayment && styles.disabledBtn,
                      ]}
                      onPress={() => handlePurchase(prod)}
                      disabled={isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.purchaseBtnText}>
                          {`Get Pass · ₦${(prod.amount / 100).toLocaleString()}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Order History Section */}
        {orders.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Purchase History</Text>
            {orders.map((ord) => (
              <TouchableOpacity
                key={ord.id}
                activeOpacity={0.7}
                onPress={() => setSelectedOrderForDetail(ord)}
                style={[
                  styles.orderRow,
                  { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: theme.border },
                ]}
              >
                <View style={styles.orderMain}>
                  <Text style={[styles.orderTitle, { color: theme.text }]}>{ord.title || ord.productId}</Text>
                  <Text style={[styles.orderRef, { color: theme.textSecondary }]}>Ref: {ord.orderReference}</Text>
                  <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.orderEnd}>
                  <Text style={[styles.orderAmount, { color: theme.text }]}>₦{(ord.amount / 100).toLocaleString()}</Text>
                  <View
                    style={[
                      styles.orderStatusPill,
                      {
                        backgroundColor:
                          ord.status === 'COMPLETED'
                            ? '#d1fae5'
                            : ord.status === 'PENDING'
                            ? '#fef3c7'
                            : '#fee2e2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        {
                          color:
                            ord.status === 'COMPLETED'
                              ? '#065f46'
                              : ord.status === 'PENDING'
                              ? '#92400e'
                              : '#991b1b',
                        },
                      ]}
                    >
                      {ord.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} style={{ marginTop: 2 }} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Paystack Test Notice */}
        <View style={styles.sandboxNotice}>
          <Ionicons name="card-outline" size={16} color="#64748b" />
          <Text style={styles.sandboxText}>Paystack Test Mode Sandbox · Zero real charges incurred</Text>
        </View>
      </ScrollView>

      {/* Transaction Details Modal */}
      <Modal
        visible={!!selectedOrderForDetail}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedOrderForDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: theme.border },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="receipt-outline" size={20} color="#008F73" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Payment Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedOrderForDetail(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedOrderForDetail && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 14 }}>
                {/* Amount & Status Card */}
                <View style={[styles.detailHero, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}>
                  <Text style={[styles.detailHeroAmount, { color: theme.text }]}>
                    ₦{(selectedOrderForDetail.amount / 100).toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.orderStatusPill,
                      {
                        backgroundColor:
                          selectedOrderForDetail.status === 'COMPLETED'
                            ? '#d1fae5'
                            : selectedOrderForDetail.status === 'PENDING'
                            ? '#fef3c7'
                            : '#fee2e2',
                        marginTop: 6,
                        alignSelf: 'center',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        {
                          color:
                            selectedOrderForDetail.status === 'COMPLETED'
                              ? '#065f46'
                              : selectedOrderForDetail.status === 'PENDING'
                              ? '#92400e'
                              : '#991b1b',
                          fontSize: 11,
                        },
                      ]}
                    >
                      {selectedOrderForDetail.status}
                    </Text>
                  </View>
                </View>

                {/* Purpose Section */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionLabel, { color: theme.textSecondary }]}>
                    WHAT THIS PAYMENT IS FOR
                  </Text>
                  <Text style={[styles.detailProductTitle, { color: theme.text }]}>
                    {selectedOrderForDetail.title || selectedOrderForDetail.productId}
                  </Text>
                  <Text style={[styles.detailProductDesc, { color: theme.textSecondary }]}>
                    {selectedOrderForDetail.description ||
                      'Grants full verified access to Brain Buzz academic curriculum, untimed CBT mock trials, detailed question solutions, and study passes.'}
                  </Text>
                </View>

                {/* Order Details List */}
                <View style={[styles.detailSection, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowKey, { color: theme.textSecondary }]}>Account ID</Text>
                    <Text
                      selectable={true}
                      style={[styles.detailRowValue, { color: '#008F73', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' }]}
                    >
                      {(selectedOrderForDetail.studentDisplayId && selectedOrderForDetail.studentDisplayId.startsWith('BB-') ? selectedOrderForDetail.studentDisplayId : null) ||
                       (user?.displayId && user.displayId.startsWith('BB-') ? user.displayId : null) ||
                       (user?.customId && user.customId.startsWith('BB-') ? user.customId : null) ||
                       (user?.id ? `BB-STU-${String(user.id).replace(/-/g, '').slice(-4).toUpperCase()}` : 'BB-STU-001')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowKey, { color: theme.textSecondary }]}>Order Reference</Text>
                    <Text
                      selectable={true}
                      style={[styles.detailRowValue, { color: '#008F73', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
                    >
                      {selectedOrderForDetail.orderReference}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowKey, { color: theme.textSecondary }]}>Payment Method</Text>
                    <Text style={[styles.detailRowValue, { color: theme.text }]}>Paystack Checkout</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowKey, { color: theme.textSecondary }]}>Gateway Ref</Text>
                    <Text
                      selectable={true}
                      style={[styles.detailRowValue, { color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }]}
                    >
                      {selectedOrderForDetail.gatewayTransactionId || selectedOrderForDetail.gatewayReference || '—'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailRowKey, { color: theme.textSecondary }]}>Date & Time</Text>
                    <Text style={[styles.detailRowValue, { color: theme.text }]}>
                      {new Date(selectedOrderForDetail.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Pending Resolution CTA */}
                {selectedOrderForDetail.status === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    disabled={isVerifyingSelected}
                    onPress={() => handleVerifySelectedOrder(selectedOrderForDetail.orderReference)}
                  >
                    {isVerifyingSelected ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={16} color="#ffffff" />
                        <Text style={styles.verifyBtnText}>Verify / Confirm Payment Status</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.modalCloseBtn, { borderColor: theme.border }]}
              onPress={() => setSelectedOrderForDetail(null)}
            >
              <Text style={[styles.modalCloseText, { color: theme.text }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  equityCard: {
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  equityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  equityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  equityText: {
    fontSize: 12,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tierPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  entitlementDetails: {
    marginTop: 4,
  },
  sessionText: {
    fontSize: 12,
    marginBottom: 8,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  unlockedList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 10,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  purchasedActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  unlockedHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  benefitItem: {
    fontSize: 11,
    lineHeight: 18,
  },
  freeTierContent: {
    marginTop: 2,
  },
  freeTierDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  verifyPendingBtn: {
    marginTop: 12,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyPendingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  activeTabBtn: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  productsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  productDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
  },
  priceSub: {
    fontSize: 10,
    marginTop: 1,
  },
  benefitsBox: {
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 5,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitRowText: {
    fontSize: 11,
  },
  purchaseBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchasedBtn: {
    backgroundColor: '#10b981',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  purchaseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingWrap: {
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 12,
  },
  historySection: {
    marginBottom: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  orderMain: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderRef: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 10,
    marginTop: 1,
  },
  orderEnd: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sandboxNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  sandboxText: {
    fontSize: 11,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailHero: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  detailHeroAmount: {
    fontSize: 26,
    fontWeight: '800',
  },
  detailSection: {
    marginBottom: 12,
  },
  detailSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailProductTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailProductDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailRowKey: {
    fontSize: 12,
  },
  detailRowValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#008F73',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCloseBtn: {
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
