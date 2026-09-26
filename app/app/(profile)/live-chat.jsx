// app/app/(profile)/live-chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useSupportRequestsQuery,
  useSupportDetailsQuery,
  useCreateSupportMutation,
  useAddSupportMessageMutation,
} from '../../hooks/useSupportQuery';
import { socketService } from '../../services/socket';

const CATEGORIES = [
  { id: 'academic', label: 'Academic & Courses', icon: 'school-outline' },
  { id: 'technical', label: 'Technical Issue', icon: 'cog-outline' },
  { id: 'account', label: 'Account & Security', icon: 'account-outline' },
  { id: 'billing', label: 'Billing & Access', icon: 'card-outline' },
  { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#6B7280' },
  { id: 'medium', label: 'Medium', color: '#D97706' },
  { id: 'high', label: 'High', color: '#EF4444' },
  { id: 'urgent', label: 'Urgent', color: '#991B1B' },
];

export default function LiveChatScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, isDarkMode } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const currentUserId = user?.id || user?.userId || profile?.id;

  // Selected Ticket State
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // New Request Form State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('academic');
  const [newPriority, setNewPriority] = useState('medium');
  const [newMessage, setNewMessage] = useState('');

  // Message Reply Input State
  const [replyText, setReplyText] = useState('');
  const messagesListRef = useRef(null);

  // Queries & Mutations
  const { data: supportRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } =
    useSupportRequestsQuery();

  const { data: ticketDetails, isLoading: isLoadingDetails } =
    useSupportDetailsQuery(selectedRequestId);

  const { mutateAsync: createSupportRequest, isPending: isCreating } =
    useCreateSupportMutation();

  const { mutateAsync: addSupportMessage, isPending: isSendingReply } =
    useAddSupportMessageMutation();

  // Socket.IO real-time listener for active ticket
  useEffect(() => {
    if (!selectedRequestId) return;

    socketService.connect();
    socketService.joinSupport(selectedRequestId);

    const handleNewSupportMessage = (msg) => {
      if (msg && msg.requestId === selectedRequestId) {
        queryClient.setQueryData(['supportDetails', selectedRequestId], (oldDetails) => {
          if (!oldDetails) return oldDetails;
          const oldMessages = oldDetails.messages || [];
          const exists = oldMessages.some((m) => m.id === msg.id);
          if (exists) return oldDetails;
          return {
            ...oldDetails,
            messages: [...oldMessages, msg],
          };
        });
        setTimeout(() => {
          messagesListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    socketService.on('new_support_message', handleNewSupportMessage);

    return () => {
      socketService.off('new_support_message', handleNewSupportMessage);
      socketService.leaveSupport(selectedRequestId);
    };
  }, [selectedRequestId, queryClient]);

  const handleCreateRequest = async () => {
    if (!newSubject.trim() || newSubject.trim().length < 3) {
      Alert.alert('Validation Error', 'Subject must be at least 3 characters long.');
      return;
    }
    if (!newMessage.trim() || newMessage.trim().length < 5) {
      Alert.alert('Validation Error', 'Message must be at least 5 characters long.');
      return;
    }

    try {
      const created = await createSupportRequest({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newMessage.trim(),
      });

      setShowNewModal(false);
      setNewSubject('');
      setNewMessage('');
      setNewCategory('academic');
      setNewPriority('medium');

      if (created?.id) {
        setSelectedRequestId(created.id);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create support ticket.');
    }
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || isSendingReply || !selectedRequestId) return;

    setReplyText('');
    try {
      await addSupportMessage({
        requestId: selectedRequestId,
        message: text,
      });
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send message.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#0284C7';
      case 'in_progress':
        return '#D97706';
      case 'resolved':
        return '#10B981';
      case 'closed':
        return '#6B7280';
      default:
        return '#0284C7';
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return (status || 'Open').charAt(0).toUpperCase() + (status || 'Open').slice(1);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // =====================================================
  // 1. TICKET DETAIL / CONVERSATION VIEW
  // =====================================================
  if (selectedRequestId) {
    const isClosed = ticketDetails?.status === 'closed';

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        {/* Detail Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={() => setSelectedRequestId(null)} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={[styles.detailTitle, { color: theme.text }]} numberOfLines={1}>
              {ticketDetails?.subject || 'Support Ticket'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(ticketDetails?.status)}20` }
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(ticketDetails?.status) }]}>
                  {formatStatus(ticketDetails?.status)}
                </Text>
              </View>
              <Text style={{ fontFamily: 'Ubuntu-Regular', fontSize: 11, color: theme.textSecondary }}>
                Category: {ticketDetails?.category || 'general'}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => queryClient.invalidateQueries({ queryKey: ['supportDetails', selectedRequestId] })}>
            <Ionicons name="refresh-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages Body */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {isLoadingDetails ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading ticket messages...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={messagesListRef}
              data={ticketDetails?.messages || []}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => messagesListRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
                const isUser = item.senderRole === 'user' || String(item.senderId) === String(currentUserId);
                const isAssistant = item.senderRole === 'assistant' || item.senderRole === 'support';

                return (
                  <View style={[styles.messageRow, isUser ? styles.rowMe : styles.rowOther]}>
                    {!isUser && (
                      <View style={[styles.supportAvatar, { backgroundColor: isAssistant ? '#6366F1' : theme.primary }]}>
                        <MaterialCommunityIcons
                          name={isAssistant ? "robot-outline" : "headset"}
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                    )}

                    <View
                      style={[
                        styles.msgBubble,
                        isUser
                          ? [styles.bubbleMe, { backgroundColor: theme.primary }]
                          : [styles.bubbleOther, { backgroundColor: theme.card, borderColor: theme.border }],
                      ]}
                    >
                      {!isUser && (
                        <Text style={[styles.senderLabel, { color: isAssistant ? '#818CF8' : theme.primary }]}>
                          {isAssistant ? 'Support Assistant' : 'Support Team'}
                        </Text>
                      )}
                      <Text style={[styles.msgText, { color: isUser ? '#FFFFFF' : theme.text }]}>
                        {item.message}
                      </Text>
                      <Text style={[styles.msgTime, { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Composer */}
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.card }}>
            {isClosed ? (
              <View style={[styles.closedNotice, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.closedText, { color: theme.textSecondary }]}>
                  This ticket has been marked closed by support.
                </Text>
              </View>
            ) : (
              <View style={[styles.composer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
                <TextInput
                  style={[
                    styles.composerInput,
                    { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', color: theme.text },
                  ]}
                  placeholder="Type your reply..."
                  placeholderTextColor={theme.textSecondary}
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor:
                        replyText.trim() && !isSendingReply ? theme.primary : `${theme.primary}50`,
                    },
                  ]}
                  onPress={handleSendReply}
                  disabled={!replyText.trim() || isSendingReply}
                  activeOpacity={0.8}
                >
                  {isSendingReply ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // 2. TICKETS LIST / HOME VIEW
  // =====================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Support Desk</Text>
        <TouchableOpacity
          onPress={() => setShowNewModal(true)}
          style={[styles.newBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Ticket List */}
      {isLoadingRequests ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading your support requests...
          </Text>
        </View>
      ) : supportRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: `${theme.primary}15` }]}>
            <MaterialCommunityIcons name="headset" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Support Requests Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Have an academic question, app issue, or billing inquiry? Submit a ticket and our support team will assist you.
          </Text>
          <TouchableOpacity
            style={[styles.createFirstBtn, { backgroundColor: theme.primary }]}
            onPress={() => setShowNewModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
            <Text style={styles.createFirstText}>Submit New Request</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={supportRequests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={refetchRequests}
          refreshing={isLoadingRequests}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.ticketCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setSelectedRequestId(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.ticketCardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(item.status)}20` }
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {formatStatus(item.status)}
                  </Text>
                </View>
                <Text style={[styles.ticketDate, { color: theme.textSecondary }]}>
                  {formatTime(item.updatedAt || item.createdAt)}
                </Text>
              </View>

              <Text style={[styles.ticketSubject, { color: theme.text }]} numberOfLines={1}>
                {item.subject}
              </Text>

              {item.lastMessage?.message ? (
                <Text style={[styles.ticketSnippet, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.lastMessage.message}
                </Text>
              ) : null}

              <View style={styles.ticketFooter}>
                <View style={styles.ticketCategoryRow}>
                  <MaterialCommunityIcons name="folder-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.ticketCategoryText, { color: theme.textSecondary }]}>
                    {item.category}
                  </Text>
                </View>

                {item.messageCount > 0 && (
                  <View style={styles.messageCountRow}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.primary} />
                    <Text style={[styles.messageCountText, { color: theme.primary }]}>
                      {item.messageCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* CREATE NEW SUPPORT REQUEST MODAL */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewModal(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Support Request</Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Subject */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Subject</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Brief summary of the issue..."
                placeholderTextColor={theme.textSecondary}
                value={newSubject}
                onChangeText={setNewSubject}
                maxLength={150}
              />

              {/* Category */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Category</Text>
              <View style={styles.categoriesWrap}>
                {CATEGORIES.map((cat) => {
                  const isSelected = newCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.background,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setNewCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={cat.icon}
                        size={16}
                        color={isSelected ? '#FFFFFF' : theme.text}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Priority */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Priority</Text>
              <View style={styles.prioritiesRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = newPriority === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.priorityChip,
                        {
                          backgroundColor: isSelected ? p.color : theme.background,
                          borderColor: isSelected ? p.color : theme.border,
                        },
                      ]}
                      onPress={() => setNewPriority(p.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Message */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Detailed Description</Text>
              <TextInput
                style={[
                  styles.formInput,
                  styles.formTextArea,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Explain the issue or question in detail..."
                placeholderTextColor={theme.textSecondary}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={2000}
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.primary },
                  isCreating && { opacity: 0.7 },
                ]}
                onPress={handleCreateRequest}
                disabled={isCreating}
                activeOpacity={0.8}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18 },
  detailTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 16 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBtnText: { color: '#FFFFFF', fontFamily: 'Ubuntu-Bold', fontSize: 13 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontFamily: 'Ubuntu-Regular', fontSize: 13, marginTop: 10 },
  listContent: { padding: 20, gap: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontFamily: 'Ubuntu-Regular', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  createFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  createFirstText: { color: '#FFFFFF', fontFamily: 'Ubuntu-Bold', fontSize: 15 },
  ticketCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  ticketCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontFamily: 'Ubuntu-Bold', fontSize: 11 },
  ticketDate: { fontFamily: 'Ubuntu-Regular', fontSize: 12 },
  ticketSubject: { fontFamily: 'Ubuntu-Bold', fontSize: 16, marginBottom: 6 },
  ticketSnippet: { fontFamily: 'Ubuntu-Regular', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(150,150,150,0.2)' },
  ticketCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketCategoryText: { fontFamily: 'Ubuntu-Medium', fontSize: 12, textTransform: 'capitalize' },
  messageCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  messageCountText: { fontFamily: 'Ubuntu-Bold', fontSize: 12 },

  // Messages Styles
  messagesList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', marginVertical: 4 },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 },
  supportAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4, borderWidth: 1 },
  senderLabel: { fontFamily: 'Ubuntu-Bold', fontSize: 11, marginBottom: 2 },
  msgText: { fontFamily: 'Ubuntu-Regular', fontSize: 14, lineHeight: 20 },
  msgTime: { fontFamily: 'Ubuntu-Regular', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, gap: 10 },
  composerInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'Ubuntu-Regular', fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  closedNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  closedText: { fontFamily: 'Ubuntu-Medium', fontSize: 13 },

  // Modal Styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18 },
  inputLabel: { fontFamily: 'Ubuntu-Bold', fontSize: 13, marginBottom: 6, marginTop: 12 },
  formInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontFamily: 'Ubuntu-Regular', fontSize: 14 },
  formTextArea: { minHeight: 110 },
  categoriesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  catChipText: { fontFamily: 'Ubuntu-Medium', fontSize: 12 },
  prioritiesRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  priorityChipText: { fontFamily: 'Ubuntu-Bold', fontSize: 12 },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20 },
  submitBtnText: { color: '#FFFFFF', fontFamily: 'Ubuntu-Bold', fontSize: 15 },
});