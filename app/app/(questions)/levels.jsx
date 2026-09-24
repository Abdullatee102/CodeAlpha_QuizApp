// src/app/(main)/levels.js

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../store/themeStore';

const LEVELS = [100, 200, 300, 400, 500];

export default function LevelsScreen() {
  const router = useRouter();

  const {
    departmentId,
    departmentName,
    departmentCode,
    facultyId,
    facultyName,
    facultyCode,
  } = useLocalSearchParams();

  const { theme } = useThemeStore();

  const handleLevelPress = (level) => {
    router.push({
      pathname: '/(questions)/semesters',
      params: {
        departmentId,
        departmentName,
        departmentCode,
        facultyId,
        facultyName,
        facultyCode,
        level: String(level),
      },
    });
  };

  const LEVEL_COLORS = {
    100: '#059669',
    200: '#2563EB',
    300: '#4F46E5',
    400: '#7C3AED',
    500: '#D97706',
  };

  const renderLevel = ({ item }) => {
    const accentColor = LEVEL_COLORS[item] || theme.primary;
    return (
      <TouchableOpacity
        style={[
          styles.levelCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleLevelPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: `${accentColor}18`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="school-outline"
            size={28}
            color={accentColor}
          />
        </View>

        <View style={styles.levelInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={[
                styles.levelTitle,
                { color: theme.text },
              ]}
            >
              {item} Level
            </Text>
            <View
              style={{
                marginLeft: 8,
                backgroundColor: `${accentColor}15`,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  color: accentColor,
                  fontSize: 11,
                  fontFamily: 'Ubuntu-Bold',
                }}
              >
                Year {item / 100}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.levelSubtitle,
              { color: theme.textSecondary, marginTop: 4 },
            ]}
          >
            Academic curriculum & courses for {item}L
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color={theme.text}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text },
            ]}
          >
            Select Level
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            {departmentName}
          </Text>
        </View>
      </View>

      {/* Selected Department */}
      <View
        style={[
          styles.departmentCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.departmentIcon,
            {
              backgroundColor: `${theme.primary}20`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="book-education-outline"
            size={27}
            color={theme.primary}
          />
        </View>

        <View style={styles.departmentInfo}>
          <Text
            style={[
              styles.departmentName,
              { color: theme.text },
            ]}
            numberOfLines={2}
          >
            {departmentName}
          </Text>

          <Text
            style={[
              styles.departmentCode,
              { color: theme.textSecondary },
            ]}
          >
            {departmentCode}
          </Text>
        </View>
      </View>

      {/* Levels */}
      <View style={styles.content}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.text },
          ]}
        >
          Choose your level
        </Text>

        <FlatList
          data={LEVELS}
          renderItem={renderLevel}
          keyExtractor={(item) => String(item)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },

  backButton: {
    marginRight: 15,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 22,
  },

  headerSubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    marginTop: 3,
  },

  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 25,
  },

  departmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  departmentInfo: {
    flex: 1,
  },

  departmentName: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
  },

  departmentCode: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginTop: 4,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 20,
    marginBottom: 15,
  },

  listContent: {
    paddingBottom: 30,
  },

  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  levelInfo: {
    flex: 1,
  },

  levelTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
  },

  levelSubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginTop: 4,
  },
});