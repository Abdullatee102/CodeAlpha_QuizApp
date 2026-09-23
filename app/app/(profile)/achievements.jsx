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
          icon: 'code-tags',
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
          <MaterialCommunityIcons
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