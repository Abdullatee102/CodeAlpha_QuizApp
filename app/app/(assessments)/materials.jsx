import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';

const CATEGORIES = [
  { id: 'ALL', label: 'All Files' },
  { id: 'LECTURE_NOTE', label: 'Lecture Notes' },
  { id: 'SLIDE', label: 'Slides' },
  { id: 'SYLLABUS', label: 'Syllabus' },
  { id: 'LAB_MANUAL', label: 'Lab Manuals' },
  { id: 'READING', label: 'Readings' },
  { id: 'OTHER', label: 'Other' },
];

export default function CourseMaterialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { offeringId, courseCode, courseTitle } = params;

  const { theme, isDarkMode } = useThemeStore();
  const { fetchCourseMaterials, downloadCourseMaterial } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [materialsData, setMaterialsData] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [downloadingId, setDownloadingId] = useState(null);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );

  const loadMaterials = useCallback(
    async (isRefresh = false, category = activeCategory) => {
      if (!offeringId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);

      const catParam = category === 'ALL' ? undefined : category;
      const res = await fetchCourseMaterials(offeringId, catParam);

      if (res.success && res.data) {
        setMaterialsData(res.data.materials || []);
      } else {
        setErrorMsg(res.error?.message || 'Failed to retrieve course learning materials.');
      }

      setLoading(false);
      setRefreshing(false);
    },
    [offeringId, activeCategory, fetchCourseMaterials]
  );

  useEffect(() => {
    loadMaterials(false, activeCategory);
  }, [activeCategory, loadMaterials]);

  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
  };

  const handleDownload = async (material) => {
    setDownloadingId(material.id);
    try {
      const res = await downloadCourseMaterial(offeringId, material.id);
      if (res.success) {
        if (material.fileUrl) {
          await Linking.openURL(material.fileUrl);
        } else {
          Alert.alert('Downloaded', `"${material.title}" is ready.`);
        }
      } else {
        Alert.alert('Download Error', res.error?.message || 'Unable to download file.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to download file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFormatBadge = (mimeType = '', originalFileName = '') => {
    const ext = originalFileName.split('.').pop()?.toLowerCase() || '';
    if (mimeType.includes('pdf') || ext === 'pdf') {
      return { icon: 'file-pdf-box', color: '#EF4444', label: 'PDF', bg: '#FEF2F2' };
    }
    if (mimeType.includes('word') || ['doc', 'docx'].includes(ext)) {
      return { icon: 'file-word-box', color: '#2563EB', label: 'DOC', bg: '#EFF6FF' };
    }
    if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(ext)) {
      return { icon: 'file-powerpoint-box', color: '#D97706', label: 'PPT', bg: '#FFFBEB' };
    }
    if (mimeType.includes('zip') || ['zip', 'rar', '7z'].includes(ext)) {
      return { icon: 'folder-zip', color: '#7C3AED', label: 'ZIP', bg: '#F5F3FF' };
    }
    return { icon: 'file-document-outline', color: '#4F46E5', label: ext.toUpperCase() || 'FILE', bg: '#EEF2FF' };
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background || '#F9FAFB', paddingTop: topInset }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: theme.border || '#E5E7EB' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text || '#111827'} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.courseBadgeRow}>
            <View style={[styles.courseBadge, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.courseBadgeText, { color: theme.primary }]}>
                {courseCode || 'COURSE'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
              Course Materials
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text || '#111827' }]} numberOfLines={1}>
            {courseTitle || 'Learning Resources & Documents'}
          </Text>
        </View>
      </View>

      {/* Category Filter Pills */}
      <View style={[styles.filterBar, { borderBottomColor: theme.border || '#E5E7EB' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategorySelect(cat.id)}
                style={[
                  styles.categoryPill,
                  isSelected
                    ? { backgroundColor: theme.primary }
                    : {
                        backgroundColor: isDarkMode ? '#1E293B' : '#F3F4F6',
                        borderColor: theme.border || '#E5E7EB',
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary || '#6B7280' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
            Loading course materials...
          </Text>
        </View>
      ) : errorMsg && materialsData.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>
            Unable to Load Materials
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => loadMaterials(false)}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMaterials(true)}
              tintColor={theme.primary}
            />
          }
        >
          {/* Header Stats Banner */}
          <View
            style={[
              styles.statsBanner,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: theme.border || '#E5E7EB',
              },
            ]}
          >
            <View style={styles.statsIconWrap}>
              <Ionicons name="folder-open" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statsTitle, { color: theme.text || '#111827' }]}>
                {materialsData.length} {materialsData.length === 1 ? 'Resource' : 'Resources'} Available
              </Text>
              <Text style={[styles.statsSub, { color: theme.textSecondary || '#6B7280' }]}>
                Lecturer-approved course documents, slides, and syllabus files.
              </Text>
            </View>
          </View>

          {materialsData.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={54}
                color={isDarkMode ? '#4B5563' : '#9CA3AF'}
              />
              <Text style={[styles.emptyTitle, { color: theme.text || '#111827' }]}>
                No Materials Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
                {activeCategory === 'ALL'
                  ? 'No learning materials have been published for this course offering yet.'
                  : `No materials found under the "${CATEGORIES.find((c) => c.id === activeCategory)?.label}" category.`}
              </Text>
            </View>
          ) : (
            materialsData.map((item) => {
              const badge = getFormatBadge(item.mimeType, item.originalFileName || item.title);
              const isDownloading = downloadingId === item.id;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.materialCard,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderColor: theme.border || '#E5E7EB',
                    },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.fileTypeBadge, { backgroundColor: isDarkMode ? '#0F172A' : badge.bg }]}>
                      <MaterialCommunityIcons name={badge.icon} size={28} color={badge.color} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.tagRow}>
                        <View style={[styles.categoryTag, { backgroundColor: theme.primary + '15' }]}>
                          <Text style={[styles.categoryTagText, { color: theme.primary }]}>
                            {item.category?.replace(/_/g, ' ') || 'GENERAL'}
                          </Text>
                        </View>
                        <Text style={[styles.fileSizeText, { color: theme.textSecondary || '#6B7280' }]}>
                          {formatFileSize(item.fileSizeBytes)}
                        </Text>
                      </View>

                      <Text style={[styles.materialTitle, { color: theme.text || '#111827' }]}>
                        {item.title}
                      </Text>
                    </View>
                  </View>

                  {/* Material Description - fully shown! */}
                  {item.description ? (
                    <Text style={[styles.materialDesc, { color: theme.textSecondary || '#4B5563' }]}>
                      {item.description}
                    </Text>
                  ) : null}

                  {/* Card Footer */}
                  <View style={[styles.cardFooter, { borderTopColor: isDarkMode ? '#334155' : '#F3F4F6' }]}>
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="cloud-download-outline"
                        size={14}
                        color={theme.textSecondary || '#6B7280'}
                      />
                      <Text style={[styles.metaText, { color: theme.textSecondary || '#6B7280' }]}>
                        {item.downloadCount ?? 0} downloads
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.downloadBtn, { backgroundColor: theme.primary }]}
                      onPress={() => handleDownload(item)}
                      disabled={isDownloading}
                      activeOpacity={0.8}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="download-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.downloadBtnText}>Download</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  courseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  courseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  statsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsSub: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  materialCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fileTypeBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fileSizeText: {
    fontSize: 11,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  materialDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
