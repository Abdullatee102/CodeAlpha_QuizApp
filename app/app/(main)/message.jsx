// app/app/(main)/message.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  useAcademicChannelsQuery,
  useRecentConversationsQuery,
  useJoinAcademicChannelMutation,
} from '../../hooks/useMessagesQuery';
import {
  getFacultyMeta,
  getDepartmentMeta,
} from '../../constants/academicIcons';

export default function MessageScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useThemeStore();

  const [activeTab, setActiveTab] = useState('faculty'); // 'faculty' | 'department' | 'level'
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const { data: channelsData, isLoading: isLoadingChannels } =
    useAcademicChannelsQuery();
  const { data: recentChats = [], isLoading: isLoadingRecent } =
    useRecentConversationsQuery();
  const { mutateAsync: joinChannel } = useJoinAcademicChannelMutation();

  const handleOpenChannel = async (channel) => {
    try {
      setIsJoining(true);
      const conversation = await joinChannel({
        type: channel.type,
        targetId: channel.id,
        level: channel.level,
        title: channel.title,
        code: channel.code,
      });

      router.push({
        pathname: '/conversation',
        params: {
          conversationId: conversation.id,
          title: conversation.title,
          code: conversation.code || '',
          type: conversation.type,
        },
      });
    } catch (err) {
      console.error('[MESSAGE SCREEN] Failed to open channel:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpenRecentChat = (chat) => {
    router.push({
      pathname: '/conversation',
      params: {
        conversationId: chat.id,
        title: chat.title,
        code: chat.code || '',
        type: chat.type,
      },
    });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter channels based on active tab and search query
  const filteredChannels = useMemo(() => {
    if (!channelsData) return [];
    let items = [];
    if (activeTab === 'faculty') {
      items = channelsData.faculties || [];
    } else if (activeTab === 'department') {
      items = channelsData.departments || [];
    } else if (activeTab === 'level') {
      items = channelsData.levels || [];
    }

    if (!searchQuery.trim()) return items;

    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q)
    );
  }, [channelsData, activeTab, searchQuery]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Academic Discussions
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Collaborate and learn with fellow LAUTECH scholars
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search academic forums, departments..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Academic Discussions Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Academic Forums
          </Text>
          <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
            Join discussion channels scoped by academic context
          </Text>
        </View>

        {/* Segmented Filter */}
        <View
          style={[
            styles.segmentContainer,
            { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'faculty' && {
                backgroundColor: theme.card,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('faculty')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    activeTab === 'faculty'
                      ? theme.primary
                      : theme.textSecondary,
                  fontFamily:
                    activeTab === 'faculty' ? 'Ubuntu-Bold' : 'Ubuntu-Regular',
                },
              ]}
            >
              Faculty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'department' && {
                backgroundColor: theme.card,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('department')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    activeTab === 'department'
                      ? theme.primary
                      : theme.textSecondary,
                  fontFamily:
                    activeTab === 'department' ? 'Ubuntu-Bold' : 'Ubuntu-Regular',
                },
              ]}
            >
              Department
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'level' && {
                backgroundColor: theme.card,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('level')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    activeTab === 'level'
                      ? theme.primary
                      : theme.textSecondary,
                  fontFamily:
                    activeTab === 'level' ? 'Ubuntu-Bold' : 'Ubuntu-Regular',
                },
              ]}
            >
              Level
            </Text>
          </TouchableOpacity>
        </View>

        {/* Academic Channel Cards List */}
        {isLoadingChannels || isJoining ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {isJoining ? 'Connecting to discussion forum...' : 'Loading academic forums...'}
            </Text>
          </View>
        ) : filteredChannels.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={36}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No forums found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              No academic discussions matched your search.
            </Text>
          </View>
        ) : (
          <View style={styles.channelsList}>
            {filteredChannels.slice(0, 8).map((channel, index) => {
              let meta;
              if (activeTab === 'faculty') {
                meta = getFacultyMeta(channel);
              } else if (activeTab === 'department') {
                meta = getDepartmentMeta(channel);
              } else {
                meta = { icon: 'school-outline', color: '#6366F1' };
              }

              return (
                <TouchableOpacity
                  key={channel.id || `${channel.level}-${index}`}
                  style={[
                    styles.channelCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleOpenChannel(channel)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${meta.color}15` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon}
                      size={24}
                      color={meta.color}
                    />
                  </View>

                  <View style={styles.channelInfo}>
                    <View style={styles.channelTitleRow}>
                      <Text
                        style={[styles.channelTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {channel.title}
                      </Text>
                      {channel.code && (
                        <View
                          style={[
                            styles.codeBadge,
                            { backgroundColor: `${meta.color}15` },
                          ]}
                        >
                          <Text
                            style={[styles.codeBadgeText, { color: meta.color }]}
                          >
                            {channel.code}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.channelDescription,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {channel.description || 'Open academic community forum'}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recent Conversations Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Discussions
          </Text>
          <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
            Active threads you have participated in
          </Text>
        </View>

        {isLoadingRecent ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : recentChats.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: `${theme.primary}15` },
              ]}
            >
              <MaterialCommunityIcons
                name="forum-outline"
                size={36}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Recent Discussions
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              You haven&apos;t joined any discussion threads yet. Tap an academic forum above to start asking questions and collaborating with classmates.
            </Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={[
                  styles.recentCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleOpenRecentChat(chat)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.recentIconBox,
                    { backgroundColor: `${theme.primary}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={22}
                    color={theme.primary}
                  />
                </View>

                <View style={styles.recentInfo}>
                  <View style={styles.recentTopRow}>
                    <Text
                      style={[styles.recentTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {chat.title}
                    </Text>
                    <Text
                      style={[
                        styles.recentTime,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {formatTimestamp(chat.lastMessage?.createdAt || chat.updatedAt)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.recentMessageSnippet,
                      { color: theme.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {chat.lastMessage?.senderName
                      ? `${chat.lastMessage.senderName.split(' ')[0]}: `
                      : ''}
                    {chat.lastMessage?.text || 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Ubuntu-Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Ubuntu-Regular',
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Ubuntu-Bold',
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 13,
  },
  channelsList: {
    gap: 8,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelTitle: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Bold',
    flex: 1,
    marginRight: 6,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Bold',
  },
  channelDescription: {
    fontSize: 12,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 2,
  },
  recentList: {
    gap: 10,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  recentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentTitle: {
    fontSize: 14,
    fontFamily: 'Ubuntu-Bold',
    flex: 1,
    marginRight: 8,
  },
  recentTime: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Regular',
  },
  recentMessageSnippet: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Ubuntu-Bold',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  centerContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 8,
  },
});
