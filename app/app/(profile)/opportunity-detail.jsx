import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import api from '../../data/api';
import { useThemeStore } from '../../store/themeStore';

export default function OpportunityDetailScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme, isDarkMode } = useThemeStore();

  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/opportunities/${id}`);
      if (res.data?.data) {
        setOpportunity(res.data.data);
        setIsBookmarked(Boolean(res.data.data.isBookmarked));
      } else {
        setError('Opportunity details could not be loaded.');
      }
    } catch (err) {
      console.error('[OPPORTUNITY DETAIL ERROR]', err);
      setError(err?.response?.data?.message || 'Failed to load opportunity details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (bookmarkLoading || !opportunity) return;
    try {
      setBookmarkLoading(true);
      const nextState = !isBookmarked;
      setIsBookmarked(nextState); // Optimistic update
      const res = await api.post(`/opportunities/${opportunity.id}/bookmark`);
      if (res.data?.data) {
        setIsBookmarked(Boolean(res.data.data.isBookmarked));
      }
    } catch (err) {
      setIsBookmarked(!isBookmarked); // Rollback on error
      Alert.alert('Error', 'Unable to update bookmark. Please try again.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleOpenLink = () => {
    if (!opportunity?.applicationUrl) return;
    setShowSafetyModal(true);
  };

  const proceedToExternalBrowser = async () => {
    setShowSafetyModal(false);
    const url = opportunity?.applicationUrl;
    if (!url) return;

    // Track click asynchronously
    api.post(`/opportunities/${opportunity.id}/track-click`, { action: 'outbound_click' }).catch(() => {});

    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: theme.card,
        controlsColor: theme.primary,
        enableBarCollapsing: true,
      });
    } catch (e) {
      console.warn('[BROWSER LAUNCH FAILED]', e);
      Alert.alert('Could Not Open Link', 'Unable to open external link in browser.');
    }
  };

  const renderCategoryIcon = (category) => {
    switch (category) {
      case 'SCHOLARSHIPS':
        return <Ionicons name="school-outline" size={20} color={theme.primary} />;
      case 'ORGANISATIONS':
        return <MaterialCommunityIcons name="account-group-outline" size={20} color={theme.primary} />;
      case 'TUTORIALS':
        return <Ionicons name="play-circle-outline" size={20} color={theme.primary} />;
      default:
        return <Ionicons name="compass-outline" size={20} color={theme.primary} />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background, paddingTop: topInset }]}
        edges={['left', 'right', 'bottom']}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading opportunity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !opportunity) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background, paddingTop: topInset }]}
        edges={['left', 'right', 'bottom']}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error || 'Opportunity not found'}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={fetchDetail}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background, paddingTop: topInset }]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]} numberOfLines={1}>
          Opportunity Details
        </Text>
        <TouchableOpacity onPress={toggleBookmark} hitSlop={12}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? theme.primary : theme.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Organization Card Banner */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.heroTopRow}>
            {opportunity.logoUrl ? (
              <Image source={{ uri: opportunity.logoUrl }} style={styles.orgLogo} contentFit="cover" />
            ) : (
              <View style={[styles.orgLogoPlaceholder, { backgroundColor: theme.primary + '18' }]}>
                {renderCategoryIcon(opportunity.category)}
              </View>
            )}

            <View style={styles.heroInfoCol}>
              <View style={styles.orgNameRow}>
                <Text style={[styles.orgName, { color: theme.text }]} numberOfLines={1}>
                  {opportunity.organization}
                </Text>
                {opportunity.verificationStatus === 'VERIFIED' && (
                  <Ionicons name="checkmark-circle" size={16} color="#008F73" style={styles.verifiedIcon} />
                )}
              </View>

              <View style={styles.tagRow}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
                    {opportunity.category}
                  </Text>
                </View>
                {opportunity.isFeatured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>FEATURED</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{opportunity.title}</Text>
          <Text style={[styles.shortDesc, { color: theme.textSecondary }]}>
            {opportunity.shortDescription}
          </Text>

          {/* Timing & Deadline Badge */}
          <View style={[styles.metaPillRow, { borderTopColor: theme.border }]}>
            <View style={styles.metaPill}>
              <Ionicons
                name="time-outline"
                size={16}
                color={
                  opportunity.daysRemaining !== null && opportunity.daysRemaining <= 7
                    ? '#E59500'
                    : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.metaPillText,
                  {
                    color:
                      opportunity.daysRemaining !== null && opportunity.daysRemaining <= 7
                        ? '#E59500'
                        : theme.textSecondary,
                  },
                ]}
              >
                {opportunity.daysRemaining !== null
                  ? opportunity.daysRemaining <= 7
                    ? `Closing Soon: ${opportunity.daysRemaining} days left`
                    : `Deadline: ${opportunity.daysRemaining} days left`
                  : 'Ongoing Membership / Admissions'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Overview */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {opportunity.fullDescription}
          </Text>
        </View>

        {/* Section: Requirements & Eligibility */}
        {opportunity.requirements ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Eligibility & Requirements</Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              {opportunity.requirements}
            </Text>
          </View>
        ) : null}

        {/* Section: Benefits & Awards */}
        {opportunity.benefits ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Benefits & Awards</Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              {opportunity.benefits}
            </Text>
          </View>
        ) : null}

        {/* Section: Contact & Inquiries */}
        {(opportunity.contactEmail || opportunity.contactPhone) ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Inquiries & Support</Text>
            {opportunity.contactEmail ? (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={16} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.textSecondary }]}>
                  {opportunity.contactEmail}
                </Text>
              </View>
            ) : null}
            {opportunity.contactPhone ? (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={16} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.textSecondary }]}>
                  {opportunity.contactPhone}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      {opportunity.applicationUrl ? (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
            onPress={handleOpenLink}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionBtnText}>
              {opportunity.category === 'ORGANISATIONS'
                ? 'Join Organisation / Chapter'
                : opportunity.category === 'TUTORIALS'
                ? 'Register for Tutorial'
                : 'Visit Application Portal'}
            </Text>
            <Ionicons name="open-outline" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* External Link Safety Interstitial Modal */}
      <Modal visible={showSafetyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.safetyModalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.warningIconCircle, { backgroundColor: '#E5950020' }]}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#E59500" />
            </View>

            <Text style={[styles.safetyModalTitle, { color: theme.text }]}>External Opportunity</Text>

            <Text style={[styles.safetyModalBody, { color: theme.textSecondary }]}>
              You are navigating to an external portal:
            </Text>

            <View style={[styles.urlBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.urlText, { color: theme.primary }]} numberOfLines={2}>
                {opportunity.applicationUrl}
              </Text>
            </View>

            <Text style={[styles.safetyNotice, { color: theme.textSecondary }]}>
              • Brain Buzz never collects application fees or student portal passwords for external opportunities.{'\n'}
              • Verify that the official destination matches legitimate institution channels before submitting sensitive information.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setShowSafetyModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalProceedBtn, { backgroundColor: theme.primary }]}
                onPress={proceedToExternalBrowser}
              >
                <Text style={styles.modalProceedText}>Proceed to Browser</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontFamily: 'Ubuntu-Bold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  orgLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 14,
  },
  orgLogoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroInfoCol: {
    flex: 1,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orgName: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  featuredBadge: {
    backgroundColor: '#FFB020',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 9,
    color: '#000000',
  },
  title: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 19,
    lineHeight: 26,
    marginBottom: 10,
  },
  shortDesc: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  metaPillRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaPillText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
    marginLeft: 6,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    marginBottom: 10,
  },
  bodyText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 13,
    marginLeft: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryActionBtnText: {
    fontFamily: 'Ubuntu-Bold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  safetyModalContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  warningIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  safetyModalTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  safetyModalBody: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  urlBox: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  urlText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  safetyNotice: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
  },
  modalProceedBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalProceedText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

