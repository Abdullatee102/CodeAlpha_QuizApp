import React, {
  useMemo,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { useThemeStore } from '../../store/themeStore';

import { useAchievementsQuery } from '../../hooks/useAchievementsQuery';

function AchievementIcon({ name, size, color }) {
  if (name === 'code-slash' || name === 'code') {
    return <Ionicons name={name} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={name || 'trophy'} size={size} color={color} />;
}

export default function AchievementScreen() {
  const router = useRouter();

  const {
    theme,
    isDarkMode,
  } = useThemeStore();

  // =====================================================
  // TANSTACK QUERY
  // =====================================================

  const {
    data: unlockedAchievements = [],
    isLoading,
    isFetching,
    refetch,
  } = useAchievementsQuery();

  // =====================================================
  // NORMALIZE USER UNLOCKED ACHIEVEMENT IDS
  // =====================================================

  const activeUserUnlockedIds =
    useMemo(() => {
      const rawIds =
        unlockedAchievements || [];

      return rawIds
        .map((item) => {
          if (
            typeof item === 'string' ||
            typeof item === 'number'
          ) {
            return String(item);
          }

          return String(
            item?.achievementKey ||
              item?.key ||
              item?.id ||
              ''
          );
        })
        .filter(Boolean);
    }, [unlockedAchievements]);

  // =====================================================
  // AVAILABLE ACHIEVEMENTS
  // =====================================================

  const ACHIEVEMENTS =
    useMemo(
      () => [
        {
          id: '1',
          title: 'Fast Learner',
          desc: 'Complete 5 quizzes',
          icon: 'speedometer',
          color: '#4834D4',
        },
        {
          id: '2',
          title: 'Perfect Score',
          desc: 'Get 100% in any quiz',
          icon: 'trophy',
          color: '#FF9F43',
        },
        {
          id: '3',
          title: 'Scholar Status',
          desc: 'Reach 1000 Total Pts',
          icon: 'school',
          color: '#6AB04C',
        },
        {
          id: '4',
          title: 'CSC Starter',
          desc: 'Complete a Computer Science quiz',
          icon: 'xml',
          color: '#27AE60',
        },
        {
          id: '5',
          title: 'Consistency',
          desc: 'Achieve a 7-day streak',
          icon: 'fire',
          color: '#FF5E57',
        },
        {
          id: '6',
          title: 'Night Owl',
          desc: 'Take a quiz after 10PM',
          icon: 'weather-moonset',
          color: '#EB4D4B',
        },
        {
          id: '7',
          title: 'Early Bird',
          desc: 'Take a quiz before 7AM',
          icon: 'weather-sunny',
          color: '#F59E0B',
        },
        {
          id: '8',
          title: 'Hat Trick',
          desc: 'Score 100% three times',
          icon: 'star-circle',
          color: '#8B5CF6',
        },
        {
          id: '9',
          title: 'Warm Up',
          desc: 'Complete your first quiz',
          icon: 'rocket-launch',
          color: '#EC4899',
        },
        {
          id: '10',
          title: '3-Day Streak',
          desc: 'Maintain a 3-day streak',
          icon: 'calendar-check',
          color: '#14B8A6',
        },
        {
          id: '11',
          title: 'Marathon',
          desc: 'Complete 25 quizzes',
          icon: 'run-fast',
          color: '#F97316',
        },
        {
          id: '12',
          title: 'Century',
          desc: 'Complete 100 quizzes',
          icon: 'numeric-100-box',
          color: '#EF4444',
        },
        {
          id: '13',
          title: 'Theory Master',
          desc: 'Score 80%+ on 5 theory assessments',
          icon: 'book-open-page-variant',
          color: '#6366F1',
        },
        {
          id: '14',
          title: 'CBT Champion',
          desc: 'Score 80%+ on 10 CBT quizzes',
          icon: 'laptop',
          color: '#0EA5E9',
        },
        {
          id: '15',
          title: 'Multi-Faculty',
          desc: 'Complete quizzes from 3 different faculties',
          icon: 'domain',
          color: '#A855F7',
        },
        {
          id: '16',
          title: 'Department Explorer',
          desc: 'Complete quizzes from 5 departments',
          icon: 'compass-outline',
          color: '#10B981',
        },
        {
          id: '17',
          title: 'Weekend Warrior',
          desc: 'Take 5 quizzes on weekends',
          icon: 'beach',
          color: '#F472B6',
        },
        {
          id: '18',
          title: 'Speed Demon',
          desc: 'Complete a CBT quiz in under 60 seconds',
          icon: 'lightning-bolt',
          color: '#FBBF24',
        },
        {
          id: '19',
          title: 'Deep Thinker',
          desc: 'Write 500+ words in a theory answer',
          icon: 'head-lightbulb',
          color: '#7C3AED',
        },
        {
          id: '20',
          title: 'Improvement Arc',
          desc: 'Improve score by 30%+ on a retake',
          icon: 'trending-up',
          color: '#22C55E',
        },
        {
          id: '21',
          title: 'EEE Explorer',
          desc: 'Complete an Electrical Engineering quiz',
          icon: 'flash',
          color: '#EAB308',
        },
        {
          id: '22',
          title: 'MTH Solver',
          desc: 'Complete a Mathematics quiz',
          icon: 'calculator-variant',
          color: '#3B82F6',
        },
        {
          id: '23',
          title: 'PHY Pioneer',
          desc: 'Complete a Physics quiz',
          icon: 'atom',
          color: '#06B6D4',
        },
        {
          id: '24',
          title: 'Social Scholar',
          desc: 'Join 3 academic discussion channels',
          icon: 'forum',
          color: '#8B5CF6',
        },
        {
          id: '25',
          title: 'Perfectionist',
          desc: 'Get 5 perfect scores in a row',
          icon: 'check-decagram',
          color: '#F59E0B',
        },
        {
          id: '26',
          title: '14-Day Streak',
          desc: 'Maintain a 14-day streak',
          icon: 'calendar-star',
          color: '#DC2626',
        },
        {
          id: '27',
          title: '30-Day Streak',
          desc: 'Maintain a 30-day streak',
          icon: 'calendar-month',
          color: '#9333EA',
        },
        {
          id: '28',
          title: 'Support Hero',
          desc: 'Help another student via support chat',
          icon: 'hand-heart',
          color: '#EC4899',
        },
        {
          id: '29',
          title: 'All-Rounder',
          desc: 'Complete quizzes in 10 different courses',
          icon: 'chart-donut',
          color: '#0D9488',
        },
        {
          id: '30',
          title: 'Quiz Legend',
          desc: 'Complete 200 quizzes total',
          icon: 'crown',
          color: '#B45309',
        },
      ],
      []
    );

  // =====================================================
  // RENDER ACHIEVEMENT
  // =====================================================

  const renderItem = ({
    item,
  }) => {
    const isUnlocked =
      activeUserUnlockedIds.includes(
        item.id
      );

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor:
              theme.card,

            borderColor:
              theme.border,
          },

          !isUnlocked &&
            (isDarkMode
              ? styles.lockedCardDark
              : styles.lockedCardLight),
        ]}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor:
                isUnlocked
                  ? `${item.color}20`
                  : isDarkMode
                  ? '#334155'
                  : '#F5F5F5',
            },
          ]}
        >
          <AchievementIcon
            name={
              isUnlocked
                ? item.icon
                : 'lock'
            }
            size={32}
            color={
              isUnlocked
                ? item.color
                : isDarkMode
                ? '#64748B'
                : '#CCC'
            }
          />
        </View>

        <Text
          style={[
            styles.title,
            {
              color:
                theme.text,
            },

            !isUnlocked && {
              color:
                isDarkMode
                  ? '#64748B'
                  : '#AAA',
            },
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.desc,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {item.desc}
        </Text>

        {isUnlocked && (
          <View
            style={
              styles.checkBadge
            }
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#27AE60"
            />
          </View>
        )}
      </View>
    );
  };

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color:
                theme.primary,
            },
          ]}
        >
          Achievements
        </Text>

        <View
          style={{
            width: 24,
          }}
        />
      </View>

      {isLoading ? (
        <View
          style={
            styles.loaderContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={
              theme.primary ||
              '#4834D4'
            }
          />
        </View>
      ) : (
        <FlatList
          data={ACHIEVEMENTS}
          renderItem={renderItem}
          keyExtractor={(item) =>
            item.id
          }
          numColumns={2}
          contentContainerStyle={
            styles.list
          }
          columnWrapperStyle={
            styles.row
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshing={
            isFetching &&
            !isLoading
          }
          onRefresh={refetch}
        />
      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    header: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      padding: 25,
    },

    headerTitle: {
      fontFamily:
        'Archivo-Black',
      fontSize: 20,
    },

    loaderContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
    },

    list: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },

    row: {
      justifyContent:
        'space-between',
      marginBottom: 15,
    },

    card: {
      width: '47%',
      borderRadius: 22,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.02,
      shadowRadius: 5,
    },

    lockedCardLight: {
      backgroundColor:
        '#FAFAFA',
      opacity: 0.7,
    },

    lockedCardDark: {
      backgroundColor:
        '#1E293B',
      opacity: 0.6,
    },

    iconBox: {
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent:
        'center',
      alignItems: 'center',
      marginBottom: 12,
    },

    title: {
      fontFamily:
        'Ubuntu-Bold',
      fontSize: 14,
      textAlign: 'center',
    },

    desc: {
      fontFamily:
        'Ubuntu-Regular',
      fontSize: 10,
      textAlign: 'center',
      marginTop: 4,
    },

    checkBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
    },
  });
