import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import api from '../../data/api';
import { useThemeStore } from '../../store/themeStore';

const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'SCHOLARSHIPS', label: 'Scholarships' },
  { id: 'ORGANISATIONS', label: 'Organisations' },
  { id: 'TUTORIALS', label: 'Tutorials' },
  { id: 'SAVED', label: 'Saved' },
];

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'featured' | 'closing_soon'
  const [searchQuery, setSearchQuery] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Notification Preferences State (Server-Synced)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    SCHOLARSHIPS: true,
    ORGANISATIONS: true,
    TUTORIALS: true,
  });

  const fetchOpportunities = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = {};
      if (selectedCategory === 'SAVED') {
        params.filter = 'bookmarked';
      } else {
        if (selectedCategory !== 'ALL') {
          params.category = selectedCategory;
        }
        if (filterType !== 'all') {
          params.filter = filterType;
        }
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/opportunities', { params });
      if (res.data?.data?.opportunities) {
        setOpportunities(res.data.data.opportunities);
      } else {
        setOpportunities([]);
      }
    } catch (err) {
      console.error('[OPPORTUNITIES FETCH ERROR]', err);
      setError(err?.response?.data?.message || 'Failed to load opportunities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, filterType, searchQuery]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const loadPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const res = await api.get('/opportunities/preferences');
      if (res.data?.data?.preferences) {
        setPreferences(res.data.data.preferences);
      }
    } catch (err) {
      console.warn('[PREFERENCES FETCH FAILED]', err);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleOpenPreferences = () => {
    setShowPreferencesModal(true);
    loadPreferences();
  };

  const togglePreference = async (categoryKey) => {
    const nextVal = !preferences[categoryKey];
    setPreferences((prev) => ({ ...prev, [categoryKey]: nextVal })); // Optimistic update

    try {
      await api.put('/opportunities/preferences', {
        category: categoryKey,
        isEnabled: nextVal,
      });
    } catch (err) {
      console.error('[PREFERENCE UPDATE FAILED]', err);
      setPreferences((prev) => ({ ...prev, [categoryKey]: !nextVal })); // Rollback
      Alert.alert('Error', 'Failed to update notification setting. Please check your connection.');
    }
  };

  const toggleBookmark = async (oppId) => {
    // Optimistic toggle in local list
    setOpportunities((prev) =>
      prev.map((item) =>
        item.id === oppId ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );

    try {
      await api.post(`/opportunities/${oppId}/bookmark`);
      // If we are on the SAVED tab and item was unbookmarked, remove it from list
      if (selectedCategory === 'SAVED') {
        setOpportunities((prev) => prev.filter((item) => item.id !== oppId));
      }
    } catch (err) {
      console.error('[BOOKMARK TOGGLE FAILED]', err);
      // Rollback
      setOpportunities((prev) =>
        prev.map((item) =>
          item.id === oppId ? { ...item, isBookmarked: !item.isBookmarked } : item
        )
      );
    }
  };

  const renderCategoryIcon = (category) => {
    switch (category) {
      case 'SCHOLARSHIPS':
        return <Ionicons name="school-outline" size={24} color={theme.primary} />;
      case 'ORGANISATIONS':
        return <MaterialCommunityIcons name="account-group-outline" size={24} color={theme.primary} />;
      case 'TUTORIALS':
        return <Ionicons name="play-circle-outline" size={24} color={theme.primary} />;
      default:
        return <Ionicons name="compass-outline" size={24} color={theme.primary} />;
    }
  };

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
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Opportunities
        </Text>
        <TouchableOpacity onPress={handleOpenPreferences} hitSlop={12} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search scholarships, orgs, tutorials..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => fetchOpportunities()}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Secondary Filter Chips (Only when not in SAVED tab) */}
      {selectedCategory !== 'SAVED' && (
        <View style={styles.subFilterBar}>
          <TouchableOpacity
            style={[
              styles.subFilterChip,
              filterType === 'all'
                ? { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                : { backgroundColor: 'transparent', borderColor: theme.border },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.subFilterChipText,
                { color: filterType === 'all' ? theme.primary : theme.textSecondary },
              ]}
            >
              All Listings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subFilterChip,
              filterType === 'featured'
                ? { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                : { backgroundColor: 'transparent', borderColor: theme.border },
            ]}
            onPress={() => setFilterType('featured')}
          >
            <Ionicons
              name="sparkles-outline"
              size={13}
              color={filterType === 'featured' ? theme.primary : theme.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.subFilterChipText,
                { color: filterType === 'featured' ? theme.primary : theme.textSecondary },
              ]}
            >
              Featured
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subFilterChip,
              filterType === 'closing_soon'
                ? { backgroundColor: '#E5950020', borderColor: '#E59500' }
                : { backgroundColor: 'transparent', borderColor: theme.border },
            ]}
            onPress={() => setFilterType('closing_soon')}
          >
            <Ionicons
              name="time-outline"
              size={13}
              color={filterType === 'closing_soon' ? '#E59500' : theme.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.subFilterChipText,
                { color: filterType === 'closing_soon' ? '#E59500' : theme.textSecondary },
              ]}
            >
              Closing Soon
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading opportunities...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => fetchOpportunities()}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOpportunities(true)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {opportunities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={54} color={theme.textSecondary + '70'} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No opportunities found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {selectedCategory === 'SAVED'
                  ? 'You have not saved any opportunities yet. Tap the bookmark icon on any opportunity card to save it here.'
                  : 'Check back soon for new scholarships, organisations, and study sessions.'}
              </Text>
            </View>
          ) : (
            opportunities.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() =>
                  router.push({
                    pathname: '/(profile)/opportunity-detail',
                    params: { id: item.id },
                  })
                }
                activeOpacity={0.88}
              >
                {/* Header row: Logo, Org Name, Category Tag, Bookmark */}
                <View style={styles.cardHeaderRow}>
                  {item.logoUrl ? (
                    <Image source={{ uri: item.logoUrl }} style={styles.cardLogo} contentFit="cover" />
                  ) : (
                    <View style={[styles.cardLogoPlaceholder, { backgroundColor: theme.primary + '18' }]}>
                      {renderCategoryIcon(item.category)}
                    </View>
                  )}

                  <View style={styles.cardHeaderTextCol}>
                    <View style={styles.orgNameWrapper}>
                      <Text style={[styles.cardOrgName, { color: theme.text }]} numberOfLines={1}>
                        {item.organization}
                      </Text>
                      {item.verificationStatus === 'VERIFIED' && (
                        <Ionicons name="checkmark-circle" size={15} color="#008F73" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={[styles.categoryTag, { color: theme.primary }]}>
                      {item.category}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleBookmark(item.id)}
                    hitSlop={10}
                    style={styles.bookmarkBtn}
                  >
                    <Ionicons
                      name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={22}
                      color={item.isBookmarked ? theme.primary : theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Title & Description */}
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
                  {item.title}
                </Text>

                <Text style={[styles.cardDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.shortDescription}
                </Text>

                <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

                {/* Footer metadata chips */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.metaChip}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={
                        item.daysRemaining !== null && item.daysRemaining <= 7
                          ? '#E59500'
                          : theme.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.metaChipText,
                        {
                          color:
                            item.daysRemaining !== null && item.daysRemaining <= 7
                              ? '#E59500'
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {item.daysRemaining !== null
                        ? item.daysRemaining <= 7
                          ? `Closes in ${item.daysRemaining}d`
                          : `${item.daysRemaining} days left`
                        : 'Ongoing'}
                    </Text>
                  </View>

                  <View style={styles.viewDetailPill}>
                    <Text style={[styles.viewDetailText, { color: theme.primary }]}>Learn More</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          <Text style={[styles.bottomNotice, { color: theme.textSecondary }]}>
            Brain Buzz verifies institutional announcements. Opportunities are subject to organizer guidelines.
          </Text>
        </ScrollView>
      )}

      {/* Notification Preferences Modal */}
      <Modal visible={showPreferencesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.prefModalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.prefModalHeader}>
              <View style={styles.prefTitleGroup}>
                <Ionicons name="notifications-outline" size={22} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.prefModalTitle, { color: theme.text }]}>Opportunity Alerts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPreferencesModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.prefModalSubtitle, { color: theme.textSecondary }]}>
              Customize which opportunity categories send push notifications to your devices.
            </Text>

            {preferencesLoading ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.switchList}>
                <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.switchLabelGroup}>
                    <Text style={[styles.switchTitle, { color: theme.text }]}>Scholarships & Grants</Text>
                    <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                      Tuition assistance, STEM awards, and financial aid
                    </Text>
                  </View>
                  <Switch
                    value={preferences.SCHOLARSHIPS}
                    onValueChange={() => togglePreference('SCHOLARSHIPS')}
                    trackColor={{ false: theme.border, true: theme.primary + '80' }}
                    thumbColor={preferences.SCHOLARSHIPS ? theme.primary : theme.textSecondary}
                  />
                </View>

                <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.switchLabelGroup}>
                    <Text style={[styles.switchTitle, { color: theme.text }]}>Student Organisations</Text>
                    <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                      JCIN, MindsHive, USF, and campus communities
                    </Text>
                  </View>
                  <Switch
                    value={preferences.ORGANISATIONS}
                    onValueChange={() => togglePreference('ORGANISATIONS')}
                    trackColor={{ false: theme.border, true: theme.primary + '80' }}
                    thumbColor={preferences.ORGANISATIONS ? theme.primary : theme.textSecondary}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchLabelGroup}>
                    <Text style={[styles.switchTitle, { color: theme.text }]}>Tutorials & Masterclasses</Text>
                    <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                      Review sessions, math bootcamps, and exam workshops
                    </Text>
                  </View>
                  <Switch
                    value={preferences.TUTORIALS}
                    onValueChange={() => togglePreference('TUTORIALS')}
                    trackColor={{ false: theme.border, true: theme.primary + '80' }}
                    thumbColor={preferences.TUTORIALS ? theme.primary : theme.textSecondary}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.prefDoneBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowPreferencesModal(false)}
            >
              <Text style={styles.prefDoneBtnText}>Save Preferences</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },
  bellBtn: {
    padding: 4,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
  },
  categoryBar: {
    marginBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
  },
  subFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  subFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  subFilterChipText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    fontFamily: 'Ubuntu-Medium',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    fontFamily: 'Ubuntu-Bold',
    color: '#FFFFFF',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    marginRight: 12,
  },
  cardLogoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTextCol: {
    flex: 1,
  },
  orgNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOrgName: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
    flexShrink: 1,
  },
  categoryTag: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  bookmarkBtn: {
    padding: 4,
  },
  cardTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardDescription: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    marginBottom: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaChipText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
    marginLeft: 5,
  },
  viewDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
    marginRight: 2,
  },
  bottomNotice: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  prefModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 36,
  },
  prefModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prefTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefModalTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },
  prefModalSubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  switchList: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  switchLabelGroup: {
    flex: 1,
    marginRight: 14,
  },
  switchTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
    marginBottom: 3,
  },
  switchDesc: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  prefDoneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  prefDoneBtnText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
