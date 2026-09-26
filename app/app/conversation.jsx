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

        <View style={styles.headerTitleContainer}>
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
              {code ? `${code} • ` : ''}Open Academic Forum
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
