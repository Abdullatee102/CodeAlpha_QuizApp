// src/app/(main)/semesters.js

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

const SEMESTERS = [
  {
    id: 'first',
    name: 'Harmattan',
    sessionType: 'Harmattan Semester',
    subtitle: 'Alpha academic session courses',
    value: 'harmattan',
    icon: 'weather-sunset',
    color: '#D97706', // Warm Amber
  },
  {
    id: 'second',
    name: 'Rain',
    sessionType: 'Rain Semester',
    subtitle: 'Beta academic session courses',
    value: 'rain',
    icon: 'weather-pouring',
    color: '#0284C7', // Sky Blue
  },
];

export default function SemestersScreen() {
  const router = useRouter();

  const {
    departmentId,
    departmentName,
    departmentCode,
    facultyId,
    facultyName,
    facultyCode,
    level,
  } = useLocalSearchParams();

  const { theme } = useThemeStore();

  const handleSemesterPress = (semester) => {
    router.push({
      pathname: '/(questions)/courses',
      params: {
        departmentId,
        departmentName,
        departmentCode,
        facultyId,
        facultyName,
        facultyCode,
        level,
        semester: semester.value,
      },
    });
  };

  const renderSemester = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.semesterCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleSemesterPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: `${item.color}18`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={30}
            color={item.color}
          />
        </View>

        <View style={styles.semesterInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={[
                styles.semesterTitle,
                { color: theme.text },
              ]}
            >
              {item.name}
            </Text>
            <View
              style={{
                marginLeft: 8,
                backgroundColor: `${item.color}15`,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  color: item.color,
                  fontSize: 11,
                  fontFamily: 'Ubuntu-Bold',
                }}
              >
                Semester
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.semesterSubtitle,
              { color: theme.textSecondary, marginTop: 4 },
            ]}
          >
            {item.subtitle}
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
            Select Semester
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            {departmentName} • {level} Level
          </Text>
        </View>
      </View>

      {/* Selected Information */}
      <View
        style={[
          styles.selectionCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.selectionIcon,
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

        <View style={styles.selectionInfo}>
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
              styles.selectionDetails,
              { color: theme.textSecondary },
            ]}
          >
            {departmentCode} • {level} Level
          </Text>
        </View>
      </View>

      {/* Semesters */}
      <View style={styles.content}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.text },
          ]}
        >
          Choose your semester
        </Text>

        <FlatList
          data={SEMESTERS}
          renderItem={renderSemester}
          keyExtractor={(item) => item.id}
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

  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 25,
  },

  selectionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  selectionInfo: {
    flex: 1,
  },

  departmentName: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
  },

  selectionDetails: {
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

  semesterCard: {
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

  semesterInfo: {
    flex: 1,
  },

  semesterTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
  },

  semesterSubtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginTop: 4,
  },
});