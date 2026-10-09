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
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useSupportRequestsQuery,
  useSupportDetailsQuery,
  useCreateSupportMutation,
  useAddSupportMessageMutation,
  useUploadSupportAttachmentMutation,
  useUpdateSupportStatusMutation,
} from '../../hooks/useSupportQuery';
import SupportAttachmentView, { formatFileSize } from '../../components/ui/SupportAttachmentView';
import { socketService } from '../../services/socket';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

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

export function getStatusInfo(rawStatus) {
  const status = (rawStatus || 'open').toLowerCase();
  switch (status) {
    case 'open':
      return {
        label: 'Open',
        color: '#0284C7',
        bg: '#0284C718',
        icon: 'chatbubble-ellipses-outline',
      };
    case 'ai_handling':
      return {
        label: 'AI Handling',
        color: '#6366F1',
        bg: '#6366F118',
        icon: 'hardware-chip-outline',
      };
    case 'waiting_for_admin':
      return {
        label: 'Escalated to Staff',
        color: '#D97706',
        bg: '#D9770618',
        icon: 'shield-outline',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        color: '#0EA5E9',
        bg: '#0EA5E918',
        icon: 'sync-outline',
      };
    case 'waiting_for_user':
      return {
        label: 'Action Required',
        color: '#8B5CF6',
        bg: '#8B5CF618',
        icon: 'alert-circle-outline',
      };
    case 'resolved':
      return {
        label: 'Resolved',
        color: '#10B981',
        bg: '#10B98118',
        icon: 'checkmark-circle-outline',
      };
    case 'closed':
      return {
        label: 'Closed',
        color: '#6B7280',
        bg: '#6B728018',
        icon: 'lock-closed-outline',
      };
    default:
      return {
        label: 'Open',
        color: '#0284C7',
        bg: '#0284C718',
        icon: 'chatbubble-ellipses-outline',
      };
  }
}

export default function LiveChatScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { theme, isDarkMode } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const currentUserId = user?.id || user?.userId || profile?.id;

  // Selected Ticket State
  const [selectedRequestId, setSelectedRequestId] = useState(
    params?.requestId ? String(params.requestId) : null
  );

  // New Request Form State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('academic');
  const [newPriority, setNewPriority] = useState('medium');
  const [newMessage, setNewMessage] = useState('');
  const [newAttachment, setNewAttachment] = useState(null);

  // Message Reply Input State
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [isSendingLocal, setIsSendingLocal] = useState(false);
  const messagesListRef = useRef(null);

  // Deep-linking parameter effect
  useEffect(() => {
    if (params?.requestId) {
      setSelectedRequestId(String(params.requestId));
    }
  }, [params?.requestId]);

  // Queries & Mutations
  const {
    data: supportRequests = [],
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useSupportRequestsQuery();

  const {
    data: ticketDetails,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useSupportDetailsQuery(selectedRequestId);

  const { mutateAsync: createSupportRequest, isPending: isCreating } =
    useCreateSupportMutation();

  const { mutateAsync: addSupportMessage, isPending: isSendingReply } =
    useAddSupportMessageMutation();

  const { mutateAsync: uploadSupportAttachment, isPending: isUploading } =
    useUploadSupportAttachmentMutation();

  const { mutateAsync: updateSupportStatus, isPending: isUpdatingStatus } =
    useUpdateSupportStatusMutation();

  // Socket.IO real-time listener for active ticket
  useEffect(() => {
    if (!selectedRequestId) return;

    socketService.connect();
    socketService.joinSupport(selectedRequestId);

    const handleNewSupportMessage = (msg) => {
      if (msg && String(msg.requestId) === String(selectedRequestId)) {
        queryClient.setQueryData(
          ['supportDetails', selectedRequestId],
          (oldDetails) => {
            if (!oldDetails) return oldDetails;
            const oldMessages = oldDetails.messages || [];
            const exists = oldMessages.some((m) => String(m.id) === String(msg.id));
            if (exists) return oldDetails;
            return {
              ...oldDetails,
              messages: [...oldMessages, msg],
            };
          }
        );
        setTimeout(() => {
          messagesListRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    };

    socketService.on('new_support_message', handleNewSupportMessage);

    return () => {
      socketService.off('new_support_message', handleNewSupportMessage);
      socketService.leaveSupport(selectedRequestId);
    };
  }, [selectedRequestId, queryClient]);

  // Image Picker Logic with strict 5MB & image type validation
  const pickImage = async (onSelected) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select screenshots or images for support.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      let size = asset.fileSize;

      // Fallback size probe via FileSystem if picker did not populate fileSize
      if (!size && asset.uri) {
        try {
          const info = await FileSystem.getInfoAsync(asset.uri);
          if (info?.exists && info?.size) {
            size = info.size;
          }
        } catch (e) {
          console.warn('[SUPPORT] Failed to query file size via FileSystem:', e);
        }
      }

      // Check client-side 5 MB limit
      if (size && size > MAX_ATTACHMENT_SIZE) {
        Alert.alert(
          'Image Too Large',
          'Image must be 5 MB or smaller. Please choose a smaller image.'
        );
        return;
      }

      // Mime-type / extension verification
      const uriLower = (asset.uri || '').toLowerCase();
      let mime = asset.mimeType;
      if (!mime) {
        if (uriLower.endsWith('.png')) mime = 'image/png';
        else if (uriLower.endsWith('.webp')) mime = 'image/webp';
        else mime = 'image/jpeg';
      }

      if (mime && !ALLOWED_MIME_TYPES.includes(mime.toLowerCase())) {
        Alert.alert(
          'Unsupported Format',
          'Only JPEG, PNG, and WebP images are supported.'
        );
        return;
      }

      const fileName =
        asset.fileName ||
        `attachment_${Date.now()}.${mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'}`;

      onSelected({
        uri: asset.uri,
        fileName,
        size: size || 0,
        mimeType: mime,
      });
    } catch (err) {
      console.error('[SUPPORT] Error picking image:', err);
      Alert.alert('Error', 'Unable to select image. Please try again.');
    }
  };

  // Create New Ticket Flow
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

      // If user also attached an image on creation, upload it
      if (created?.id && newAttachment) {
        try {
          await uploadSupportAttachment({
            requestId: created.id,
            uri: newAttachment.uri,
            fileName: newAttachment.fileName,
            mimeType: newAttachment.mimeType,
          });
        } catch (attachErr) {
          console.warn('[SUPPORT] Attachment upload warning:', attachErr);
        }
      }

      setShowNewModal(false);
      setNewSubject('');
      setNewMessage('');
      setNewCategory('academic');
      setNewPriority('medium');
      setNewAttachment(null);

      if (created?.id) {
        setSelectedRequestId(String(created.id));
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create support ticket.');
    }
  };

  // Send Message / Attachment Flow
  const handleSendReply = async () => {
    const text = replyText.trim();
    const attachment = replyAttachment;

    if ((!text && !attachment) || isSendingReply || isUploading || isSendingLocal || !selectedRequestId) {
      return;
    }

    setIsSendingLocal(true);
    try {
      // Step 1: create message entry
      const messageContent = text || '[Screenshot attached]';
      const createdMsg = await addSupportMessage({
        requestId: selectedRequestId,
        message: messageContent,
      });

      // Step 2: if an attachment was selected, upload and associate with this message
      if (attachment) {
        await uploadSupportAttachment({
          requestId: selectedRequestId,
          uri: attachment.uri,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          messageId: createdMsg?.id,
        });
        setReplyAttachment(null);
      }

      setReplyText('');
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send message.');
    } finally {
      setIsSendingLocal(false);
    }
  };

  // Ticket Status Actions for Student (Mark Resolved or Close)
  const handleUpdateStatus = (newStatus) => {
    const isClosing = newStatus === 'CLOSED';
    Alert.alert(
      isClosing ? 'Close Ticket' : 'Mark as Resolved',
      isClosing
        ? 'Are you sure you want to close this ticket? It will become read-only.'
        : 'Do you want to mark this ticket as resolved? You can always reopen it if you still need help.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isClosing ? 'Close Ticket' : 'Mark Resolved',
          style: isClosing ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateSupportStatus({
                requestId: selectedRequestId,
                status: newStatus,
              });
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update ticket status.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const isBusySending = isSendingReply || isUploading || isSendingLocal;

  // =====================================================
  // 1. TICKET DETAIL / CONVERSATION VIEW
  // =====================================================
  if (selectedRequestId) {
    const currentStatus = (ticketDetails?.status || 'open').toLowerCase();
    const isClosed = currentStatus === 'closed';
    const isResolved = currentStatus === 'resolved';
    const isWaitingForAdmin = currentStatus === 'waiting_for_admin';
    const isWaitingForUser = currentStatus === 'waiting_for_user';
    const isAiHandling = currentStatus === 'ai_handling';
    const statusInfo = getStatusInfo(currentStatus);

    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingTop: topInset },
        ]}
        edges={['left', 'right', 'bottom']}
      >
        {/* Detail Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <TouchableOpacity
            onPress={() => setSelectedRequestId(null)}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text
              style={[styles.detailTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {ticketDetails?.subject || 'Support Ticket'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 2,
              }}
            >
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusInfo.bg },
                ]}
              >
                <Ionicons
                  name={statusInfo.icon}
                  size={12}
                  color={statusInfo.color}
                  style={{ marginRight: 3 }}
                />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Ubuntu-Regular',
                  fontSize: 11,
                  color: theme.textSecondary,
                  textTransform: 'capitalize',
                }}
              >
                • {ticketDetails?.category || 'general'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Action button to mark resolved or close */}
            {!isClosed && !isResolved && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus('RESOLVED')}
                style={[styles.headerActionBtn, { borderColor: '#10B981', backgroundColor: '#10B98115' }]}
                disabled={isUpdatingStatus}
              >
                <Ionicons name="checkmark-done" size={15} color="#10B981" />
                <Text style={[styles.headerActionText, { color: '#10B981' }]}>
                  Resolve
                </Text>
              </TouchableOpacity>
            )}

            {isResolved && !isClosed && (
              <TouchableOpacity
                onPress={() => handleUpdateStatus('CLOSED')}
                style={[styles.headerActionBtn, { borderColor: '#6B7280', backgroundColor: '#6B728015' }]}
                disabled={isUpdatingStatus}
              >
                <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
                <Text style={[styles.headerActionText, { color: '#6B7280' }]}>
                  Close
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => refetchDetails()}
              style={{ padding: 4 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Informative Status Notification Banners */}
        {isWaitingForAdmin && (
          <View style={[styles.infoBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <MaterialCommunityIcons name="shield-account-outline" size={18} color="#B45309" />
            <Text style={[styles.infoBannerText, { color: '#92400E' }]}>
              Escalated to Staff: An administrator is reviewing your inquiry and will reply shortly.
            </Text>
          </View>
        )}

        {isWaitingForUser && (
          <View style={[styles.infoBanner, { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' }]}>
            <Ionicons name="alert-circle-outline" size={18} color="#6D28D9" />
            <Text style={[styles.infoBannerText, { color: '#5B21B6' }]}>
              Action Required: Support has provided a response. Please review and reply below.
            </Text>
          </View>
        )}

        {isAiHandling && (
          <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#4F46E5" />
            <Text style={[styles.infoBannerText, { color: isDarkMode ? '#A5B4FC' : '#3730A3' }]}>
              Brain Buzz AI Assistant is active and assisting you with this ticket.
            </Text>
          </View>
        )}

        {isResolved && (
          <View style={[styles.infoBanner, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#065F46" />
            <Text style={[styles.infoBannerText, { color: '#065F46' }]}>
              This ticket is marked as resolved. You can send a message to continue or close it.
            </Text>
          </View>
        )}

        {/* Messages Body */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {isLoadingDetails ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Loading ticket messages...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={messagesListRef}
              data={ticketDetails?.messages || []}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() =>
                messagesListRef.current?.scrollToEnd({ animated: false })
              }
              ListFooterComponent={() => {
                const msgs = ticketDetails?.messages || [];
                const lastMsg = msgs[msgs.length - 1];
                const lastIsUser =
                  lastMsg &&
                  (lastMsg.senderRole === 'user' ||
                    (String(lastMsg.senderId) === String(currentUserId) &&
                      lastMsg.senderRole !== 'ai_assistant'));

                if (currentStatus === 'open' && lastIsUser) {
                  return (
                    <View style={styles.aiTypingRow}>
                      <ActivityIndicator
                        size="small"
                        color={theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.aiTypingText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Support AI is analyzing your message...
                      </Text>
                    </View>
                  );
                }
                return <View style={{ height: 12 }} />;
              }}
              renderItem={({ item, index }) => {
                const role = (item.senderRole || '').toLowerCase();
                const isUser =
                  (role === 'user' ||
                    String(item.senderId) === String(currentUserId)) &&
                  role !== 'ai_assistant' &&
                  role !== 'assistant' &&
                  role !== 'admin' &&
                  role !== 'support' &&
                  role !== 'superadmin';

                const isAi = role === 'ai_assistant' || role === 'assistant';
                const isAdmin = role === 'admin' || role === 'support' || role === 'superadmin';

                // Locate attachments attached to this message, plus unlinked attachments on the initial message
                const msgAttachments = (ticketDetails?.attachments || []).filter(
                  (att) => String(att.messageId) === String(item.id)
                );
                const unlinked =
                  index === 0
                    ? (ticketDetails?.attachments || []).filter((att) => !att.messageId)
                    : [];
                const allItemAttachments = [...msgAttachments, ...unlinked];

                return (
                  <View
                    style={[
                      styles.messageRow,
                      isUser ? styles.rowMe : styles.rowOther,
                    ]}
                  >
                    {!isUser && (
                      <View
                        style={[
                          styles.supportAvatar,
                          {
                            backgroundColor: isAi ? '#6366F1' : '#D97706',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isAi ? 'robot-outline' : 'shield-account'}
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
                          : [
                              styles.bubbleOther,
                              {
                                backgroundColor: isDarkMode ? '#1E293B' : theme.card,
                                borderColor: isAdmin ? '#D9770640' : theme.border,
                              },
                            ],
                      ]}
                    >
                      {!isUser && (
                        <View style={styles.senderHeaderRow}>
                          <Text
                            style={[
                              styles.senderLabel,
                              { color: isAi ? '#818CF8' : '#D97706' },
                            ]}
                          >
                            {isAi
                              ? 'Brain Buzz AI'
                              : item.sender?.fullName
                              ? `${item.sender.fullName} (Support)`
                              : 'Support Team'}
                          </Text>
                          <View
                            style={[
                              styles.rolePill,
                              {
                                backgroundColor: isAi ? '#6366F120' : '#D9770620',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.rolePillText,
                                { color: isAi ? '#6366F1' : '#D97706' },
                              ]}
                            >
                              {isAi
                                ? 'AI BOT'
                                : (item.sender?.role || 'STAFF')
                                    .replace('_', ' ')
                                    .toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      )}

                      <Text
                        style={[
                          styles.msgText,
                          { color: isUser ? '#FFFFFF' : theme.text },
                        ]}
                      >
                        {item.message}
                      </Text>

                      {/* Attached images rendered inside/under the bubble */}
                      {allItemAttachments.length > 0 && (
                        <View style={styles.bubbleAttachmentsWrap}>
                          {allItemAttachments.map((att) => (
                            <SupportAttachmentView
                              key={String(att.id)}
                              attachment={att}
                              theme={theme}
                              isDarkMode={isDarkMode}
                              isUserMessage={isUser}
                            />
                          ))}
                        </View>
                      )}

                      <Text
                        style={[
                          styles.msgTime,
                          {
                            color: isUser
                              ? 'rgba(255,255,255,0.7)'
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Composer Section */}
          <SafeAreaView
            edges={['left', 'right', 'bottom']}
            style={{ backgroundColor: theme.card }}
          >
            {isClosed ? (
              <View
                style={[
                  styles.closedNotice,
                  { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.closedText, { color: theme.textSecondary }]}
                >
                  This ticket has been closed. Submit a new request if you need additional help.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.composerContainer,
                  { borderTopColor: theme.border, backgroundColor: theme.card },
                ]}
              >
                {/* Compact Attachment Preview Strip */}
                {replyAttachment && (
                  <View
                    style={[
                      styles.previewStrip,
                      {
                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: replyAttachment.uri }}
                      style={styles.previewThumb}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text
                        style={[styles.previewName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {replyAttachment.fileName}
                      </Text>
                      <Text
                        style={[
                          styles.previewSize,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {formatFileSize(replyAttachment.size)} • Ready to send
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setReplyAttachment(null)}
                      disabled={isBusySending}
                      style={styles.previewRemoveBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Uploading progress notification bar */}
                {isBusySending && replyAttachment && (
                  <View style={styles.uploadingBar}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.uploadingText, { color: theme.primary }]}>
                      Uploading image attachment...
                    </Text>
                  </View>
                )}

                {/* Input row with attachment button & send action */}
                <View style={styles.composerRow}>
                  <TouchableOpacity
                    style={[
                      styles.attachBtn,
                      {
                        backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => pickImage((img) => setReplyAttachment(img))}
                    disabled={isBusySending}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={replyAttachment ? theme.primary : theme.textSecondary}
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={[
                      styles.composerInput,
                      {
                        backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                        color: theme.text,
                      },
                    ]}
                    placeholder={
                      replyAttachment
                        ? 'Add a caption (optional)...'
                        : 'Write your message...'
                    }
                    placeholderTextColor={theme.textSecondary}
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                    editable={!isBusySending}
                  />

                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      {
                        backgroundColor:
                          (replyText.trim() || replyAttachment) && !isBusySending
                            ? theme.primary
                            : `${theme.primary}40`,
                      },
                    ]}
                    onPress={handleSendReply}
                    disabled={
                      (!replyText.trim() && !replyAttachment) || isBusySending
                    }
                    activeOpacity={0.8}
                  >
                    {isBusySending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="send" size={17} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: topInset },
      ]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Support Desk
        </Text>
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
          <View
            style={[
              styles.emptyIconBox,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <MaterialCommunityIcons
              name="headset"
              size={48}
              color={theme.primary}
            />
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
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item.status);

            return (
              <TouchableOpacity
                style={[
                  styles.ticketCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setSelectedRequestId(String(item.id))}
                activeOpacity={0.7}
              >
                <View style={styles.ticketCardHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.bg },
                    ]}
                  >
                    <Ionicons
                      name={statusInfo.icon}
                      size={12}
                      color={statusInfo.color}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[styles.statusText, { color: statusInfo.color }]}
                    >
                      {statusInfo.label}
                    </Text>
                  </View>
                  <Text
                    style={[styles.ticketDate, { color: theme.textSecondary }]}
                  >
                    {formatTime(item.updatedAt || item.createdAt)}
                  </Text>
                </View>

                <Text
                  style={[styles.ticketSubject, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {item.subject}
                </Text>

                {item.lastMessage?.message ? (
                  <Text
                    style={[
                      styles.ticketSnippet,
                      { color: theme.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {item.lastMessage.message}
                  </Text>
                ) : null}

                <View style={styles.ticketFooter}>
                  <View style={styles.ticketCategoryRow}>
                    <MaterialCommunityIcons
                      name="folder-outline"
                      size={14}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.ticketCategoryText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>

                  {item.messageCount > 0 && (
                    <View style={styles.messageCountRow}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={14}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.messageCountText,
                          { color: theme.primary },
                        ]}
                      >
                        {item.messageCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* CREATE NEW SUPPORT REQUEST MODAL */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView
            style={[styles.modalBackdrop, { paddingTop: topInset }]}
            edges={['left', 'right', 'bottom']}
          >
            <View
              style={[
                styles.modalCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  New Support Request
                </Text>
                <TouchableOpacity onPress={() => setShowNewModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Subject */}
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Subject
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Brief summary of the issue..."
                  placeholderTextColor={theme.textSecondary}
                  value={newSubject}
                  onChangeText={setNewSubject}
                  maxLength={150}
                />

                {/* Category */}
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Category
                </Text>
                <View style={styles.categoriesWrap}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = newCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.background,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
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
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Priority
                </Text>
                <View style={styles.prioritiesRow}>
                  {PRIORITIES.map((p) => {
                    const isSelected = newPriority === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.priorityChip,
                          {
                            backgroundColor: isSelected
                              ? p.color
                              : theme.background,
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
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Detailed Description
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.formTextArea,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      color: theme.text,
                    },
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

                {/* Optional Screenshot Attachment */}
                <Text
                  style={[styles.inputLabel, { color: theme.textSecondary }]}
                >
                  Attachment (Optional, max 5 MB)
                </Text>

                {newAttachment ? (
                  <View
                    style={[
                      styles.previewStrip,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: newAttachment.uri }}
                      style={styles.previewThumb}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text
                        style={[styles.previewName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {newAttachment.fileName}
                      </Text>
                      <Text
                        style={[
                          styles.previewSize,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {formatFileSize(newAttachment.size)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setNewAttachment(null)}
                      style={styles.previewRemoveBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.attachPickerBox,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => pickImage((img) => setNewAttachment(img))}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={22}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.attachPickerText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Attach screenshot (JPEG, PNG, WebP)
                    </Text>
                  </TouchableOpacity>
                )}

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
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18 },
  detailTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 16 },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerActionText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 11,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newBtnText: { color: '#FFFFFF', fontFamily: 'Ubuntu-Bold', fontSize: 13 },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { fontFamily: 'Ubuntu-Regular', fontSize: 13, marginTop: 10 },
  listContent: { padding: 16, gap: 14 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createFirstText: { color: '#FFFFFF', fontFamily: 'Ubuntu-Bold', fontSize: 15 },
  ticketCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontFamily: 'Ubuntu-Bold', fontSize: 11 },
  ticketDate: { fontFamily: 'Ubuntu-Regular', fontSize: 12 },
  ticketSubject: { fontFamily: 'Ubuntu-Bold', fontSize: 16, marginBottom: 6 },
  ticketSnippet: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  ticketCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketCategoryText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  messageCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  messageCountText: { fontFamily: 'Ubuntu-Bold', fontSize: 12 },

  // Info Banners
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
    lineHeight: 16,
  },

  // Messages Styles
  messagesList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', marginVertical: 4 },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 },
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  msgBubble: { maxWidth: '82%', padding: 12, borderRadius: 16 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4, borderWidth: 1 },
  senderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderLabel: { fontFamily: 'Ubuntu-Bold', fontSize: 11 },
  rolePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rolePillText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 9,
  },
  msgText: { fontFamily: 'Ubuntu-Regular', fontSize: 14, lineHeight: 20 },
  bubbleAttachmentsWrap: {
    marginTop: 8,
    gap: 8,
  },
  msgTime: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  aiTypingRow: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTypingText: {
    fontFamily: 'Ubuntu-Regular',
    fontStyle: 'italic',
    fontSize: 12,
  },

  // Composer
  composerContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  previewThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  previewName: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
  },
  previewSize: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 11,
    marginTop: 2,
  },
  previewRemoveBtn: {
    padding: 4,
  },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  uploadingText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  closedText: { fontFamily: 'Ubuntu-Medium', fontSize: 13 },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18 },
  inputLabel: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
  },
  formTextArea: { minHeight: 100 },
  categoriesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  catChipText: { fontFamily: 'Ubuntu-Medium', fontSize: 12 },
  prioritiesRow: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityChipText: { fontFamily: 'Ubuntu-Bold', fontSize: 12 },
  attachPickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  attachPickerText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitBtnText: { color: '#FFFFFF', fontFamily: 'Ubuntu-Bold', fontSize: 15 },
});