// app/app/conversation.jsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Modal,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useQueryClient } from '@tanstack/react-query';

import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

import {
  useConversationMessagesQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
} from '../hooks/useMessagesQuery';

import { socketService } from '../services/socket';

export default function ConversationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { theme, isDarkMode } = useThemeStore();

  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const {
    conversationId,
    title,
    code,
  } = useLocalSearchParams();

  const [inputText, setInputText] = useState('');
  const [showGroupInfoModal, setShowGroupInfoModal] =
    useState(false);
  const [showMentionPicker, setShowMentionPicker] =
    useState(false);

  const [isKeyboardVisible, setIsKeyboardVisible] =
    useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );

  const currentUserId =
    user?.id ||
    user?.userId ||
    profile?.id ||
    null;

  const currentUsername =
    profile?.username ||
    user?.username ||
    null;

  const personalMentionRegex = useMemo(() => {
    if (!currentUsername) {
      return null;
    }

    const escapedUsername = String(
      currentUsername
    ).replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    return new RegExp(
      `(?:^|\\s)@${escapedUsername}(?=$|\\s|[.,!?;:(){}\\]])`,
      'i'
    );
  }, [currentUsername]);

  /*
   * ------------------------------------------------------------
   * KEYBOARD VISIBILITY
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios'
        ? 'keyboardWillShow'
        : 'keyboardDidShow';

    const hideEvent =
      Platform.OS === 'ios'
        ? 'keyboardWillHide'
        : 'keyboardDidHide';

    const showSub = Keyboard.addListener(
      showEvent,
      () => {
        setIsKeyboardVisible(true);
      }
    );

    const hideSub = Keyboard.addListener(
      hideEvent,
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * MESSAGES
   * ------------------------------------------------------------
   */

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useConversationMessagesQuery(conversationId);

  const {
    mutateAsync: sendMessage,
    isPending: isSending,
  } = useSendMessageMutation();

  /*
   * ------------------------------------------------------------
   * MARK CONVERSATION AS READ
   *
   * Whenever this screen is opened for a valid conversation,
   * notify the backend that the current user has read it.
   *
   * The mutation also clears the unread state from the
   * recentConversations React Query cache immediately.
   * ------------------------------------------------------------
   */

  const {
    mutate: markConversationAsRead,
  } = useMarkConversationReadMutation();

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    markConversationAsRead(String(conversationId));
  }, [
    conversationId,
    markConversationAsRead,
  ]);

  /*
   * ------------------------------------------------------------
   * ACTIVE MEMBERS
   *
   * Members are currently derived from:
   * - Current authenticated user
   * - Users who have sent messages in this conversation
   *
   * This preserves your existing backend architecture.
   * ------------------------------------------------------------
   */

  const activeMembers = useMemo(() => {
    const memberMap = new Map();

    if (currentUserId) {
      const myName =
        profile?.fullName ||
        user?.displayName ||
        user?.fullName ||
        'Scholar';

      memberMap.set(String(currentUserId), {
        id: String(currentUserId),
        name: myName,
        username:
          profile?.username ||
          user?.username ||
          'me',
        photoURL:
          profile?.photoURL ||
          user?.photoURL ||
          user?.avatar ||
          null,
      });
    }

    messages.forEach((msg) => {
      if (!msg?.senderId) {
        return;
      }

      const sender = msg.sender;

      const senderName =
        sender?.fullName ||
        sender?.name ||
        'Scholar';

      const senderId = String(msg.senderId);

      memberMap.set(senderId, {
        id: senderId,
        name: senderName,
        username:
          sender?.username ||
          senderName
            .split(' ')[0]
            .toLowerCase(),
        photoURL:
          sender?.photoURL ||
          sender?.avatar ||
          null,
      });
    });

    return Array.from(memberMap.values());
  }, [
    messages,
    user,
    profile,
    currentUserId,
  ]);

  /*
   * ------------------------------------------------------------
   * MENTION SEARCH
   *
   * Example:
   *
   * @
   * @ope
   * @abd
   *
   * The picker filters members based on the text after @.
   * ------------------------------------------------------------
   */

  const mentionSearch = useMemo(() => {
    const match = inputText.match(
      /(?:^|\s)@([^\s@]*)$/
    );

    if (!match) {
      return null;
    }

    return match[1].toLowerCase();
  }, [inputText]);

  const filteredMentionMembers = useMemo(() => {
    if (mentionSearch === null) {
      return activeMembers;
    }

    if (!mentionSearch) {
      return activeMembers;
    }

    return activeMembers.filter((member) => {
      const name = String(
        member.name || ''
      ).toLowerCase();

      const username = String(
        member.username || ''
      ).toLowerCase();

      return (
        name.includes(mentionSearch) ||
        username.includes(mentionSearch)
      );
    });
  }, [
    activeMembers,
    mentionSearch,
  ]);

  /*
   * Automatically show mention picker when user types @
   */

  useEffect(() => {
    if (mentionSearch !== null) {
      setShowMentionPicker(true);
    }
  }, [mentionSearch]);

  /*
   * ------------------------------------------------------------
   * SELECT MENTION
   * ------------------------------------------------------------
   */

  const handleMentionSelect = (member) => {
    if (!member) {
      return;
    }

    const tag =
      '@' +
      (
        member.username ||
        member.name?.split(' ')[0] ||
        'user'
      );

    const match = inputText.match(
      /(?:^|\s)@([^\s@]*)$/
    );

    if (match) {
      const startIndex =
        inputText.length -
        match[0].length;

      const prefix =
        inputText.slice(0, startIndex);

      const separator =
        prefix.length > 0 &&
        !prefix.endsWith(' ')
          ? ' '
          : '';

      setInputText(
        `${prefix}${separator}${tag} `
      );
    } else {
      setInputText((prev) =>
        prev
          ? `${prev} ${tag} `
          : `${tag} `
      );
    }

    setShowMentionPicker(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  /*
   * ------------------------------------------------------------
   * SOCKET.IO REAL-TIME SUBSCRIPTION
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    socketService.connect();

    socketService.joinConversation(
      conversationId
    );

    const handleNewMessage = (newMessage) => {
      if (
        !newMessage ||
        String(newMessage.conversationId) !==
          String(conversationId)
      ) {
        return;
      }

      queryClient.setQueryData(
        ['messages', conversationId],
        (oldMessages = []) => {
          const exists = oldMessages.some(
            (message) =>
              message.id ===
              newMessage.id
          );

          if (exists) {
            return oldMessages;
          }

          return [
            ...oldMessages,
            newMessage,
          ];
        }
      );

      /*
       * Because the conversation is currently open,
       * a newly received message is immediately considered
       * read after updating the message list.
       *
       * This keeps the backend read state synchronized
       * while the user is actively viewing the conversation.
       */
      markConversationAsRead(
        String(conversationId)
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    };

    socketService.on(
      'new_message',
      handleNewMessage
    );

    return () => {
      socketService.off(
        'new_message',
        handleNewMessage
      );

      socketService.leaveConversation(
        conversationId
      );
    };
  }, [
    conversationId,
    queryClient,
    markConversationAsRead,
  ]);

  /*
   * ------------------------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------------------------
   */

  const handleSend = async () => {
    const textToSend =
      inputText.trim();

    if (
      !textToSend ||
      isSending ||
      !conversationId
    ) {
      return;
    }

    setInputText('');
    setShowMentionPicker(false);

    try {
      await sendMessage({
        conversationId,
        text: textToSend,
      });

      /*
       * The conversation is already open, so sending a message
       * means the current user is actively viewing the thread.
       */
      markConversationAsRead(
        String(conversationId)
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    } catch (err) {
      console.error(
        '[CONVERSATION] Send error:',
        err
      );

      // Restore text if sending fails.
      setInputText(textToSend);
    }
  };

  /*
   * ------------------------------------------------------------
   * FORMAT MESSAGE TIME
   * ------------------------------------------------------------
   */

  const formatMessageTime = (
    dateStr
  ) => {
    if (!dateStr) {
      return '';
    }

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /*
   * ------------------------------------------------------------
   * RENDER MESSAGE
   * ------------------------------------------------------------
   */

  const renderMessageItem = ({
    item,
  }) => {
    const isMe =
      String(item?.senderId) ===
      String(currentUserId);

    const senderName =
      item?.sender?.fullName ||
      item?.sender?.name ||
      'Scholar';

    const senderInitial =
      senderName
        .charAt(0)
        .toUpperCase();

    const isPersonalMention =
      !isMe &&
      !!personalMentionRegex?.test(
        String(item?.text || '')
      );

    return (
      <View
        style={[
          styles.messageRow,
          isMe
            ? styles.messageRowMe
            : styles.messageRowOther,
        ]}
      >
        {!isMe && (
          <View
            style={[
              styles.avatarMini,
              {
                backgroundColor:
                  `${theme.primary}20`,
              },
            ]}
          >
            {item?.sender?.photoURL ? (
              <Image
                source={{
                  uri:
                    item.sender.photoURL,
                }}
                style={
                  styles.avatarImg
                }
              />
            ) : (
              <Text
                style={[
                  styles.avatarInitial,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                {senderInitial}
              </Text>
            )}
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isMe
              ? [
                  styles.bubbleMe,
                  {
                    backgroundColor:
                      theme.primary,
                  },
                ]
              : [
                  styles.bubbleOther,
                  {
                    backgroundColor:
                      theme.card,
                    borderColor:
                      isPersonalMention
                        ? theme.primary
                        : theme.border,
                  },
                  isPersonalMention &&
                    styles.mentionBubble,
                ],
          ]}
        >
          {!isMe && (
            <Text
              style={[
                styles.senderLabel,
                {
                  color:
                    theme.primary,
                },
              ]}
              numberOfLines={1}
            >
              {senderName}
            </Text>
          )}

          {isPersonalMention && (
            <View
              style={[
                styles.mentionMarker,
                {
                  backgroundColor: `${theme.primary}15`,
                },
              ]}
            >
              <Text
                style={[
                  styles.mentionMarkerText,
                  { color: theme.primary },
                ]}
              >
                @ Mentioned you
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              {
                color: isMe
                  ? '#FFFFFF'
                  : theme.text,
              },
            ]}
          >
            {item?.text || ''}
          </Text>

          <Text
            style={[
              styles.timestamp,
              {
                color: isMe
                  ? 'rgba(255,255,255,0.7)'
                  : theme.textSecondary,
              },
            ]}
          >
            {formatMessageTime(
              item?.createdAt
            )}
          </Text>
        </View>
      </View>
    );
  };

  /*
   * ------------------------------------------------------------
   * RENDER MENTION PICKER
   * ------------------------------------------------------------
   */

  const renderMentionPicker = () => {
    if (
      !showMentionPicker ||
      mentionSearch === null
    ) {
      return null;
    }

    if (
      filteredMentionMembers.length ===
      0
    ) {
      return (
        <View
          style={[
            styles.mentionContainer,
            {
              backgroundColor:
                theme.card,
              borderColor:
                theme.border,
            },
          ]}
        >
          <View
            style={
              styles.mentionHeader
            }
          >
            <Text
              style={[
                styles.mentionHeaderText,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              Mention a member
            </Text>

            <TouchableOpacity
              onPress={() =>
                setShowMentionPicker(
                  false
                )
              }
            >
              <Ionicons
                name="close"
                size={18}
                color={
                  theme.textSecondary
                }
              />
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.noMentionResults
            }
          >
            <Text
              style={[
                styles.noMentionText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              No matching members
              found.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.mentionContainer,
          {
            backgroundColor:
              theme.card,
            borderColor:
              theme.border,
          },
        ]}
      >
        <View
          style={
            styles.mentionHeader
          }
        >
          <Text
            style={[
              styles.mentionHeaderText,
              {
                color:
                  theme.text,
              },
            ]}
          >
            Mention a member
          </Text>

          <TouchableOpacity
            onPress={() =>
              setShowMentionPicker(
                false
              )
            }
          >
            <Ionicons
              name="close"
              size={18}
              color={
                theme.textSecondary
              }
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={
            filteredMentionMembers
          }
          keyExtractor={(member) =>
            String(member.id)
          }
          keyboardShouldPersistTaps="handled"
          style={
            styles.mentionList
          }
          renderItem={({
            item: member,
          }) => (
            <TouchableOpacity
              style={
                styles.mentionItem
              }
              onPress={() =>
                handleMentionSelect(
                  member
                )
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.mentionAvatar,
                  {
                    backgroundColor:
                      `${theme.primary}20`,
                  },
                ]}
              >
                {member.photoURL ? (
                  <Image
                    source={{
                      uri:
                        member.photoURL,
                    }}
                    style={
                      styles.mentionAvatarImage
                    }
                  />
                ) : (
                  <Text
                    style={[
                      styles.mentionAvatarText,
                      {
                        color:
                          theme.primary,
                      },
                    ]}
                  >
                    {member.name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      'S'}
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.mentionMemberInfo
                }
              >
                <Text
                  style={[
                    styles.mentionMemberName,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {member.name}
                </Text>

                <Text
                  style={[
                    styles.mentionMemberUsername,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  @{member.username}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  /*
   * ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------
   */

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
          paddingTop: topInset,
        },
      ]}
      edges={[
        'left',
        'right',
        'bottom',
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              theme.card,
            borderBottomColor:
              theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.headerTitleContainer
          }
          onPress={() =>
            setShowGroupInfoModal(
              true
            )
          }
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.text,
              },
            ]}
            numberOfLines={1}
          >
            {title ||
              'Discussion Forum'}
          </Text>

          <View
            style={
              styles.headerSubtitleRow
            }
          >
            <View
              style={
                styles.statusDot
              }
            />

            <Text
              style={[
                styles.headerSubtitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {code
                ? `${code} • `
                : ''}
              {activeMembers.length}{' '}
              Members • Open
              Academic Forum
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            refetch()
          }
          style={
            styles.refreshButton
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={
              theme.textSecondary
            }
          />
        </TouchableOpacity>
      </View>

      {/* CHAT */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? 90
            : 0
        }
      >
        {isLoading ? (
          <View
            style={
              styles.centerLoading
            }
          >
            <ActivityIndicator
              size="small"
              color={theme.primary}
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Loading academic
              discussion...
            </Text>
          </View>
        ) : messages.length ===
          0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={[
                styles.emptyIconBox,
                {
                  backgroundColor:
                    `${theme.primary}15`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={44}
                color={
                  theme.primary
                }
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Academic Forum
              Started
            </Text>

            <Text
              style={[
                styles.emptySubtitle,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Ask questions about
              course concepts,
              share study advice,
              and collaborate
              with your fellow
              scholars here.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) =>
              String(
                item?.id ||
                  `message-${index}`
              )
            }
            renderItem={
              renderMessageItem
            }
            contentContainerStyle={
              styles.messagesList
            }
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd(
                {
                  animated: false,
                }
              )
            }
          />
        )}

        {/* MENTION PICKER */}
        {renderMentionPicker()}

        {/* INPUT COMPOSER */}
        <View
          style={{
            backgroundColor:
              theme.card,
            paddingBottom:
              isKeyboardVisible
                ? 6
                : Math.max(
                    insets.bottom,
                    8
                  ),
          }}
        >
          <View
            style={[
              styles.composer,
              {
                backgroundColor:
                  theme.card,
                borderTopColor:
                  theme.border,
              },
            ]}
          >
            {/* MENTION BUTTON */}
            <TouchableOpacity
              style={[
                styles.mentionButton,
                {
                  backgroundColor:
                    `${theme.primary}18`,
                },
              ]}
              onPress={() => {
                setShowMentionPicker(
                  (prev) => !prev
                );

                if (
                  !inputText.includes(
                    '@'
                  )
                ) {
                  setInputText(
                    (prev) =>
                      prev
                        ? `${prev} @`
                        : '@'
                  );
                }

                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.mentionButtonText,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                @
              </Text>
            </TouchableOpacity>

            {/* TEXT INPUT */}
            <TextInput
              ref={inputRef}
              style={[
                styles.composerInput,
                {
                  backgroundColor:
                    isDarkMode
                      ? '#1E293B'
                      : '#F1F5F9',
                  color: theme.text,
                },
              ]}
              placeholder="Ask an academic question..."
              placeholderTextColor={
                theme.textSecondary
              }
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);

                if (
                  !text.includes('@')
                ) {
                  setShowMentionPicker(
                    false
                  );
                }
              }}
              multiline
              maxLength={4000}
              textAlignVertical="center"
            />

            {/* SEND BUTTON */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim()
                      .length > 0 &&
                    !isSending
                      ? theme.primary
                      : `${theme.primary}50`,
                },
              ]}
              onPress={handleSend}
              disabled={
                inputText.trim()
                  .length === 0 ||
                isSending
              }
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* GROUP INFO MODAL */}
      <Modal
        visible={
          showGroupInfoModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowGroupInfoModal(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={[
              styles.groupInfoModal,
              {
                backgroundColor:
                  theme.card,
                borderTopColor:
                  theme.border,
              },
            ]}
          >
            {/* MODAL HANDLE */}
            <View
              style={[
                styles.modalHandle,
                {
                  backgroundColor:
                    theme.border,
                },
              ]}
            />

            {/* MODAL HEADER */}
            <View
              style={
                styles.groupInfoHeader
              }
            >
              <View
                style={[
                  styles.groupInfoIcon,
                  {
                    backgroundColor:
                      `${theme.primary}20`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="forum"
                  size={26}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={
                  styles.groupInfoTitleContainer
                }
              >
                <Text
                  style={[
                    styles.groupInfoTitle,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {title ||
                    'Discussion Forum'}
                </Text>

                <Text
                  style={[
                    styles.groupInfoSubtitle,
                    {
                      color:
                        theme.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {code
                    ? `${code} • `
                    : ''}
                  Academic Community
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowGroupInfoModal(
                    false
                  )
                }
                style={
                  styles.modalCloseButton
                }
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={
                    theme.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>

            {/* ABOUT */}
            <View
              style={[
                styles.aboutBox,
                {
                  backgroundColor:
                    isDarkMode
                      ? '#1E293B'
                      : '#F8FAFC',
                  borderColor:
                    theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.aboutLabel,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                ABOUT THIS FORUM
              </Text>

              <Text
                style={[
                  styles.aboutText,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                Collaborate with LAUTECH
                scholars in{' '}
                {title ||
                  'this academic channel'}
                . Discuss assignments,
                share past questions,
                and clarify lecture
                concepts together.
              </Text>
            </View>

            {/* ACTIVE MEMBERS */}
            <Text
              style={[
                styles.activeMembersTitle,
                {
                  color:
                    theme.text,
                },
              ]}
            >
              ACTIVE MEMBERS (
              {activeMembers.length})
            </Text>

            <FlatList
              data={activeMembers}
              keyExtractor={(member) =>
                String(member.id)
              }
              style={
                styles.activeMembersList
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({
                item: member,
              }) => (
                <View
                  style={[
                    styles.memberRow,
                    {
                      borderBottomColor:
                        theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.memberAvatar,
                      {
                        backgroundColor:
                          `${theme.primary}20`,
                      },
                    ]}
                  >
                    {member.photoURL ? (
                      <Image
                        source={{
                          uri:
                            member.photoURL,
                        }}
                        style={
                          styles.memberAvatarImage
                        }
                      />
                    ) : (
                      <Text
                        style={[
                          styles.memberAvatarInitial,
                          {
                            color:
                              theme.primary,
                          },
                        ]}
                      >
                        {member.name
                          .charAt(
                            0
                          )
                          .toUpperCase()}
                      </Text>
                    )}
                  </View>

                  <View
                    style={
                      styles.memberInfo
                    }
                  >
                    <Text
                      style={[
                        styles.memberName,
                        {
                          color:
                            theme.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {member.name}
                    </Text>

                    <Text
                      style={[
                        styles.memberUsername,
                        {
                          color:
                            theme.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      @{member.username}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.memberBadge,
                      {
                        backgroundColor:
                          `${theme.primary}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.memberBadgeText,
                        {
                          color:
                            theme.primary,
                        },
                      ]}
                    >
                      {String(
                        member.id
                      ) ===
                      String(
                        currentUserId
                      )
                        ? 'You'
                        : 'Member'}
                    </Text>
                  </View>
                </View>
              )}
            />

            {/* CLOSE */}
            <TouchableOpacity
              style={[
                styles.closeForumButton,
                {
                  backgroundColor:
                    theme.primary,
                },
              ]}
              onPress={() =>
                setShowGroupInfoModal(
                  false
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.closeForumButtonText
                }
              >
                Close Forum Info
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /*
   * HEADER
   */

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
    minWidth: 0,
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
    flex: 1,
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
  },

  refreshButton: {
    padding: 8,
  },

  /*
   * CHAT
   */

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
    overflow: 'hidden',
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

  mentionBubble: {
    borderWidth: 1.5,
  },

  mentionMarker: {
    alignSelf: 'flex-start',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 6,
  },

  mentionMarkerText: {
    fontSize: 10,
    fontFamily: 'Ubuntu-Bold',
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

  /*
   * LOADING
   */

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

  /*
   * EMPTY STATE
   */

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
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    lineHeight: 19,
  },

  /*
   * COMPOSER
   */

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },

  mentionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  mentionButtonText: {
    fontSize: 16,
    fontFamily: 'Ubuntu-Bold',
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

  /*
   * MENTION PICKER
   */

  mentionContainer: {
    marginHorizontal: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: 230,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  mentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  mentionHeaderText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
  },

  mentionList: {
    maxHeight: 180,
  },

  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  mentionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  mentionAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  mentionAvatarText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
  },

  mentionMemberInfo: {
    flex: 1,
    marginLeft: 10,
  },

  mentionMemberName: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Medium',
  },

  mentionMemberUsername: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },

  noMentionResults: {
    paddingHorizontal: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },

  noMentionText: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
  },

  /*
   * GROUP INFO MODAL
   */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },

  groupInfoModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
  },

  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  groupInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  groupInfoTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  groupInfoTitle: {
    fontSize: 18,
    fontFamily: 'Ubuntu-Bold',
  },

  groupInfoSubtitle: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },

  modalCloseButton: {
    padding: 2,
    marginLeft: 8,
  },

  /*
   * ABOUT BOX
   */

  aboutBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },

  aboutLabel: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Medium',
    marginBottom: 4,
  },

  aboutText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    lineHeight: 18,
  },

  /*
   * ACTIVE MEMBERS
   */

  activeMembersTitle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
    marginBottom: 10,
  },

  activeMembersList: {
    maxHeight: 220,
  },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },

  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  memberAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  memberAvatarInitial: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Bold',
  },

  memberInfo: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },

  memberName: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Medium',
  },

  memberUsername: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },

  memberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },

  memberBadgeText: {
    fontSize: 10,
    fontFamily: 'Ubuntu-Bold',
  },

  /*
   * CLOSE BUTTON
   */

  closeForumButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },

  closeForumButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    fontSize: 14,
  },
});