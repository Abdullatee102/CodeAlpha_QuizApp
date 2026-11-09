import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useQuizStore } from '../../store/quizStore';

export default function CourseDiscussionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { offeringId, courseCode, courseTitle } = params;

  const { theme, isDarkMode } = useThemeStore();
  const {
    fetchCourseDiscussions,
    fetchDiscussionDetails,
    createCourseDiscussion,
    replyToCourseDiscussion,
  } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [discussions, setDiscussions] = useState([]);

  // Active Thread View
  const [activeThread, setActiveThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const threadScrollRef = useRef(null);

  // New Topic Modal
  const [newTopicModalOpen, setNewTopicModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );

  const loadDiscussions = useCallback(async (isRefresh = false) => {
    if (!offeringId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    const res = await fetchCourseDiscussions(offeringId);
    if (res.success && res.data) {
      setDiscussions(res.data.discussions || []);
    } else {
      setErrorMsg(res.error?.message || 'Failed to retrieve course discussions.');
    }

    setLoading(false);
    setRefreshing(false);
  }, [offeringId, fetchCourseDiscussions]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  const handleOpenThread = async (disc) => {
    setActiveThread(disc);
    setLoadingThread(true);
    const res = await fetchDiscussionDetails(offeringId, disc.id);
    setLoadingThread(false);
    if (res.success && res.data) {
      const discData = res.data.discussion || {};
      const replies = res.data.replies || discData.replies || [];
      setActiveThread({
        ...disc,
        ...discData,
        replies,
        replyCount: replies.length || discData.replyCount || disc.replyCount || 0,
      });
      setTimeout(() => {
        threadScrollRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  };

  const handleCloseThread = () => {
    setActiveThread(null);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread || submittingReply) return;
    setSubmittingReply(true);

    const res = await replyToCourseDiscussion(offeringId, activeThread.id, replyText.trim());
    setSubmittingReply(false);

    if (res.success && res.data) {
      setReplyText('');
      const newReply = res.data.reply;
      // Update thread replies locally
      setActiveThread((prev) => {
        const nextReplies = [...(prev?.replies || []), newReply];
        return {
          ...prev,
          replies: nextReplies,
          replyCount: nextReplies.length,
        };
      });
      // Update discussions list reply count
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === activeThread.id ? { ...d, replyCount: (d.replyCount || 0) + 1 } : d
        )
      );
      setTimeout(() => {
        threadScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } else {
      Alert.alert('Reply Failed', res.error?.message || 'Unable to post reply.');
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim() || creatingTopic) return;
    setCreatingTopic(true);

    const res = await createCourseDiscussion(offeringId, {
      title: newTopicTitle.trim(),
      content: newTopicContent.trim(),
    });
    setCreatingTopic(false);

    if (res.success && res.data) {
      setNewTopicTitle('');
      setNewTopicContent('');
      setNewTopicModalOpen(false);
      // Reload discussions list
      loadDiscussions(true);
    } else {
      Alert.alert('Post Failed', res.error?.message || 'Unable to create discussion topic.');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
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
          onPress={() => {
            if (activeThread) handleCloseThread();
            else router.back();
          }}
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
              {activeThread ? 'Discussion Thread' : 'Class Forum'}
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.text || '#111827' }]} numberOfLines={1}>
            {activeThread ? activeThread.title : courseTitle || 'Course Discussions'}
          </Text>
        </View>

        {!activeThread && (
          <TouchableOpacity
            style={[styles.newTopicBtn, { backgroundColor: theme.primary }]}
            onPress={() => setNewTopicModalOpen(true)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newTopicBtnText}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ======================================================== */}
      {/* THREAD VIEW (When a discussion is open) */}
      {/* ======================================================== */}
      {activeThread ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={threadScrollRef}
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Original Topic Card */}
            <View
              style={[
                styles.threadHeaderCard,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: theme.border || '#E5E7EB',
                },
              ]}
            >
              <View style={styles.authorRow}>
                <View style={[styles.authorAvatar, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.authorAvatarText, { color: theme.primary }]}>
                    {activeThread.authorName ? activeThread.authorName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.authorName, { color: theme.text || '#111827' }]}>
                      {activeThread.authorName || 'Student'}
                    </Text>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor:
                            activeThread.authorRole === 'LECTURER' ? '#EFF6FF' : '#F3F4F6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          {
                            color:
                              activeThread.authorRole === 'LECTURER' ? '#2563EB' : '#4B5563',
                          },
                        ]}
                      >
                        {activeThread.authorRole || 'STUDENT'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.dateText, { color: theme.textSecondary || '#6B7280' }]}>
                    Posted {formatDate(activeThread.createdAt)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.threadTitle, { color: theme.text || '#111827' }]}>
                {activeThread.title}
              </Text>

              <Text style={[styles.threadContent, { color: theme.textSecondary || '#374151' }]}>
                {activeThread.content}
              </Text>

              {activeThread.isLocked && (
                <View style={styles.lockedBanner}>
                  <Ionicons name="lock-closed" size={14} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.lockedBannerText}>
                    This discussion has been locked by the course lecturer.
                  </Text>
                </View>
              )}
            </View>

            {/* Replies Section */}
            <View style={styles.repliesHeaderRow}>
              <Text style={[styles.repliesSectionTitle, { color: theme.text || '#111827' }]}>
                Replies ({activeThread.replies?.length ?? activeThread.replyCount ?? 0})
              </Text>
            </View>

            {loadingThread ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
                  Loading discussion messages...
                </Text>
              </View>
            ) : (!activeThread.replies || activeThread.replies.length === 0) ? (
              <View style={styles.emptyRepliesWrap}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={36}
                  color={isDarkMode ? '#4B5563' : '#9CA3AF'}
                />
                <Text style={[styles.emptyRepliesText, { color: theme.textSecondary || '#6B7280' }]}>
                  No replies yet. Share your thoughts or answer first!
                </Text>
              </View>
            ) : (
              activeThread.replies.map((reply, idx) => (
                <View
                  key={reply.id || idx}
                  style={[
                    styles.replyCard,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderColor: theme.border || '#E5E7EB',
                    },
                  ]}
                >
                  <View style={styles.authorRow}>
                    <View
                      style={[
                        styles.authorAvatarSmall,
                        {
                          backgroundColor:
                            reply.authorRole === 'LECTURER' ? '#2563EB20' : theme.primary + '15',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.authorAvatarSmallText,
                          {
                            color:
                              reply.authorRole === 'LECTURER' ? '#2563EB' : theme.primary,
                          },
                        ]}
                      >
                        {reply.authorName ? reply.authorName.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.authorName, { color: theme.text || '#111827' }]}>
                          {reply.authorName || 'Participant'}
                        </Text>
                        <View
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor:
                                reply.authorRole === 'LECTURER' ? '#EFF6FF' : '#F3F4F6',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              {
                                color:
                                  reply.authorRole === 'LECTURER' ? '#2563EB' : '#4B5563',
                              },
                            ]}
                          >
                            {reply.authorRole || 'STUDENT'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.dateText, { color: theme.textSecondary || '#6B7280' }]}>
                        {formatDate(reply.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.replyContent, { color: theme.textSecondary || '#374151' }]}>
                    {reply.content}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Reply Composer Bar */}
          {!activeThread.isLocked && (
            <View
              style={[
                styles.composerBar,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderTopColor: theme.border || '#E5E7EB',
                },
              ]}
            >
              <TextInput
                style={[
                  styles.composerInput,
                  {
                    backgroundColor: isDarkMode ? '#0F172A' : '#F9FAFB',
                    borderColor: theme.border || '#E5E7EB',
                    color: theme.text || '#111827',
                  },
                ]}
                placeholder="Write your response..."
                placeholderTextColor={isDarkMode ? '#64748B' : '#9CA3AF'}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.composerSendBtn,
                  {
                    backgroundColor: replyText.trim() ? theme.primary : '#9CA3AF',
                  },
                ]}
                onPress={handleSendReply}
                disabled={!replyText.trim() || submittingReply}
              >
                {submittingReply ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      ) : (
        /* ======================================================== */
        /* TOPICS LIST VIEW */
        /* ======================================================== */
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
                Loading course discussions...
              </Text>
            </View>
          ) : errorMsg && discussions.length === 0 ? (
            <View style={styles.centered}>
              <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#EF4444" />
              <Text style={[styles.errorTitle, { color: theme.text || '#111827' }]}>
                Unable to Load Discussions
              </Text>
              <Text style={[styles.errorSubtitle, { color: theme.textSecondary || '#6B7280' }]}>
                {errorMsg}
              </Text>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                onPress={() => loadDiscussions(false)}
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
                  onRefresh={() => loadDiscussions(true)}
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
                  <Ionicons name="chatbubbles" size={24} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statsTitle, { color: theme.text || '#111827' }]}>
                    {discussions.length} {discussions.length === 1 ? 'Topic' : 'Topics'} Active
                  </Text>
                  <Text style={[styles.statsSub, { color: theme.textSecondary || '#6B7280' }]}>
                    Ask questions, collaborate on coursework, and discuss study topics.
                  </Text>
                </View>
              </View>

              {discussions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons
                    name="comment-question-outline"
                    size={54}
                    color={isDarkMode ? '#4B5563' : '#9CA3AF'}
                  />
                  <Text style={[styles.emptyTitle, { color: theme.text || '#111827' }]}>
                    No Discussions Yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#6B7280' }]}>
                    Be the first student to start a discussion topic or ask a question for this course!
                  </Text>
                  <TouchableOpacity
                    style={[styles.startFirstBtn, { backgroundColor: theme.primary }]}
                    onPress={() => setNewTopicModalOpen(true)}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.startFirstBtnText}>Start First Topic</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                discussions.map((topic) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicCard,
                      {
                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                        borderColor: topic.isPinned ? theme.primary : theme.border || '#E5E7EB',
                        borderWidth: topic.isPinned ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => handleOpenThread(topic)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.topicHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {topic.isPinned && (
                          <View style={[styles.pinnedBadge, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="pin" size={12} color={theme.primary} />
                            <Text style={[styles.pinnedBadgeText, { color: theme.primary }]}>
                              Pinned
                            </Text>
                          </View>
                        )}
                        {topic.isLocked && (
                          <View style={styles.lockedBadge}>
                            <Ionicons name="lock-closed" size={11} color="#D97706" />
                            <Text style={styles.lockedBadgeText}>Locked</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.dateText, { color: theme.textSecondary || '#6B7280' }]}>
                        {formatDate(topic.createdAt)}
                      </Text>
                    </View>

                    <Text style={[styles.topicTitle, { color: theme.text || '#111827' }]}>
                      {topic.title}
                    </Text>

                    <Text
                      style={[styles.topicSnippet, { color: theme.textSecondary || '#4B5563' }]}
                      numberOfLines={2}
                    >
                      {topic.content}
                    </Text>

                    <View style={[styles.topicFooter, { borderTopColor: isDarkMode ? '#334155' : '#F3F4F6' }]}>
                      <View style={styles.authorRow}>
                        <View style={[styles.authorAvatarSmall, { backgroundColor: theme.primary + '15' }]}>
                          <Text style={[styles.authorAvatarSmallText, { color: theme.primary }]}>
                            {topic.authorName ? topic.authorName.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                        <Text style={[styles.authorName, { color: theme.text || '#111827' }]}>
                          {topic.authorName || 'Student'}
                        </Text>
                        <View
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor:
                                topic.authorRole === 'LECTURER' ? '#EFF6FF' : '#F3F4F6',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              {
                                color:
                                  topic.authorRole === 'LECTURER' ? '#2563EB' : '#4B5563',
                              },
                            ]}
                          >
                            {topic.authorRole || 'STUDENT'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.repliesCountBadge}>
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.primary} />
                        <Text style={[styles.repliesCountText, { color: theme.primary }]}>
                          {topic.replyCount ?? 0}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* START NEW TOPIC MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={newTopicModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNewTopicModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: theme.border || '#E5E7EB',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text || '#111827' }]}>
                Start New Discussion
              </Text>
              <TouchableOpacity onPress={() => setNewTopicModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text || '#111827'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.text || '#111827' }]}>Topic Title</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDarkMode ? '#0F172A' : '#F9FAFB',
                  borderColor: theme.border || '#E5E7EB',
                  color: theme.text || '#111827',
                },
              ]}
              placeholder="e.g. Question on Chapter 3 Algorithm Analysis"
              placeholderTextColor={isDarkMode ? '#64748B' : '#9CA3AF'}
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
            />

            <Text style={[styles.inputLabel, { color: theme.text || '#111827', marginTop: 12 }]}>
              Question / Discussion Prompt
            </Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: isDarkMode ? '#0F172A' : '#F9FAFB',
                  borderColor: theme.border || '#E5E7EB',
                  color: theme.text || '#111827',
                },
              ]}
              placeholder="Provide details so your classmates and lecturers can help..."
              placeholderTextColor={isDarkMode ? '#64748B' : '#9CA3AF'}
              value={newTopicContent}
              onChangeText={setNewTopicContent}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border || '#E5E7EB' }]}
                onPress={() => setNewTopicModalOpen(false)}
                disabled={creatingTopic}
              >
                <Text style={[styles.modalCancelBtnText, { color: theme.text || '#111827' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={handleCreateTopic}
                disabled={creatingTopic || !newTopicTitle.trim() || !newTopicContent.trim()}
              >
                {creatingTopic ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Post Topic</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  newTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newTopicBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  startFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  startFirstBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  topicCard: {
    borderRadius: 16,
    padding: 16,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  pinnedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    gap: 3,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  dateText: {
    fontSize: 11,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  topicSnippet: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  topicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  repliesCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repliesCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  threadHeaderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  threadTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 8,
  },
  threadContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    marginTop: 12,
  },
  lockedBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  repliesHeaderRow: {
    marginTop: 16,
    marginBottom: 8,
  },
  repliesSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyRepliesWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyRepliesText: {
    fontSize: 13,
  },
  replyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  replyContent: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  composerInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 100,
  },
  composerSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
