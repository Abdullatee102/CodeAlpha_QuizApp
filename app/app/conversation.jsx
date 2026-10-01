// app/app/conversation.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import {
  useConversationMessagesQuery,
  useSendMessageMutation,
} from '../hooks/useMessagesQuery';
import { socketService } from '../services/socket';

export default function ConversationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, isDarkMode } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const { conversationId, title, code } = useLocalSearchParams();
  const [inputText, setInputText] = useState('');
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const flatListRef = useRef(null);

  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const currentUserId = user?.id || user?.userId || profile?.id;

  // Extract active members from messages array
  const activeMembers = React.useMemo(() => {
    const memberMap = new Map();
    if (user) {
      const myName = profile?.fullName || user?.displayName || user?.fullName || 'Scholar';
      memberMap.set(currentUserId, { id: currentUserId, name: myName, username: profile?.username || 'me' });
    }
    messages.forEach((msg) => {
      if (msg.senderId && msg.sender?.fullName) {
        memberMap.set(msg.senderId, {
          id: msg.senderId,
          name: msg.sender.fullName,
          username: msg.sender.username || msg.sender.fullName.split(' ')[0].toLowerCase(),
          photoURL: msg.sender.photoURL,
        });
      }
    });
    return Array.from(memberMap.values());
  }, [messages, user, profile, currentUserId]);

  const handleMentionSelect = (member) => {
    const tag = '@' + (member.username || member.name.split(' ')[0]);
    if (inputText.endsWith('@')) {
      setInputText((prev) => prev.slice(0, -1) + tag + ' ');
    } else {
      setInputText((prev) => (prev ? prev + ' ' + tag + ' ' : tag + ' '));
    }
    setShowMentionPicker(false);
  };


  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useConversationMessagesQuery(conversationId);

  const { mutateAsync: sendMessage, isPending: isSending } =
    useSendMessageMutation();

  // Socket.IO real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    socketService.connect();
    socketService.joinConversation(conversationId);

    const handleNewMessage = (newMessage) => {
      if (newMessage && newMessage.conversationId === conversationId) {
        queryClient.setQueryData(['messages', conversationId], (oldMessages = []) => {
          const exists = oldMessages.some((m) => m.id === newMessage.id);
          if (exists) return oldMessages;
          return [...oldMessages, newMessage];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    socketService.on('new_message', handleNewMessage);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.leaveConversation(conversationId);
    };
  }, [conversationId, queryClient]);

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isSending) return;

    setInputText('');
    try {
      await sendMessage({
        conversationId,
        text: textToSend,
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('[CONVERSATION] Send error:', err);
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const senderName = item.sender?.fullName || 'Scholar';
    const senderInitial = senderName.charAt(0).toUpperCase();

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        {!isMe && (
          <View
            style={[
              styles.avatarMini,
              { backgroundColor: `${theme.primary}20` },
            ]}
          >
            {item.sender?.photoURL ? (
              <Image
                source={{ uri: item.sender.photoURL }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={[styles.avatarInitial, { color: theme.primary }]}>
                {senderInitial}
              </Text>
            )}
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: theme.primary }]
              : [
                  styles.bubbleOther,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ],
          ]}
        >
          {!isMe && (
            <Text
              style={[
                styles.senderLabel,
                { color: theme.primary },
              ]}
              numberOfLines={1}
            >
              {senderName}
            </Text>
          )}

          <Text
            style={[
              styles.messageText,
              { color: isMe ? '#FFFFFF' : theme.text },
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.timestamp,
              { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerTitleContainer} onPress={() => setShowGroupInfoModal(true)} activeOpacity={0.7}>
          <Text
            style={[styles.headerTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {title || 'Discussion Forum'}
          </Text>
          <View style={styles.headerSubtitleRow}>
            <View style={styles.statusDot} />
            <Text
              style={[styles.headerSubtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {code ? `${code} • ` : ''}${activeMembers.length} Members • Open Academic Forum
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Messages List / Keyboard Container */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading academic discussion...
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={44}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Academic Forum Started
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Ask questions about course concepts, share study advice, and collaborate with your fellow scholars here.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input Composer */}
        <View
          style={{
            backgroundColor: theme.card,
            paddingBottom: isKeyboardVisible ? 6 : Math.max(insets.bottom, 8),
          }}
        >
          <View
            style={[
              styles.composer,
              {
                backgroundColor: theme.card,
                borderTopColor: theme.border,
              },
            ]}
          >
            
            <TouchableOpacity
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.primary + '18', justifyContent: 'center', alignItems: 'center', marginRight: 6 }}
              onPress={() => setShowMentionPicker(!showMentionPicker)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Ubuntu-Bold', color: theme.primary }}>@</Text>
            </TouchableOpacity>
            <TextInput
              style={[
                styles.composerInput,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                  color: theme.text,
                },
              ]}
              placeholder="Ask an academic question..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim().length > 0 && !isSending
                      ? theme.primary
                      : `${theme.primary}50`,
                },
              ]}
              onPress={handleSend}
              disabled={inputText.trim().length === 0 || isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    
      {/* GROUP INFO MODAL */}
      <Modal
        visible={showGroupInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupInfoModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', borderTopWidth: 1, borderTopColor: theme.border }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="forum" size={26} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontFamily: 'Ubuntu-Bold', color: theme.text }}>{title || 'Discussion Forum'}</Text>
                <Text style={{ fontSize: 12, fontFamily: 'Ubuntu-Regular', color: theme.textSecondary }}>{code ? code + ' • ' : ''}Academic Community</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGroupInfoModal(false)}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 12, fontFamily: 'Ubuntu-Medium', color: theme.primary, marginBottom: 4 }}>ABOUT THIS FORUM</Text>
              <Text style={{ fontSize: 13, fontFamily: 'Ubuntu-Regular', color: theme.text, lineHeight: 18 }}>
                Collaborate with LAUTECH scholars in {title || 'this academic channel'}. Discuss assignments, share past questions, and clarify lecture concepts together.
              </Text>
            </View>

            <Text style={{ fontSize: 13, fontFamily: 'Ubuntu-Bold', color: theme.text, marginBottom: 10 }}>
              ACTIVE MEMBERS ({activeMembers.length})
            </Text>

            <FlatList
              data={activeMembers}
              keyExtractor={(m) => m.id}
              style={{ maxHeight: 220 }}
              renderItem={({ item: m }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Ubuntu-Bold', color: theme.primary }}>{m.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Ubuntu-Medium', color: theme.text }}>{m.name}</Text>
                    <Text style={{ fontSize: 11, fontFamily: 'Ubuntu-Regular', color: theme.textSecondary }}>@{m.username}</Text>
                  </View>
                  <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 10, fontFamily: 'Ubuntu-Bold', color: theme.primary }}>{m.id === currentUserId ? 'You' : 'Member'}</Text>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              style={{ backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 }}
              onPress={() => setShowGroupInfoModal(false)}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Ubuntu-Bold', fontSize: 14 }}>Close Forum Info</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
  },
  refreshButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitial: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  senderLabel: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: 'Ubuntu-Regular',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  composerInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
