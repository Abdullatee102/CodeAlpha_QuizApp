// src/app/(main)/departments.js

import React, { useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuizStore } from '../../store/quizStore';
import { useThemeStore } from '../../store/themeStore';

export default function DepartmentsScreen() {
  const router = useRouter();

  const {
    facultyId,
    facultyName,
    facultyCode,
  } = useLocalSearchParams();

  const {
    departments,
    isLoadingDepartments,
    fetchDepartments,
  } = useQuizStore();

  const { theme } = useThemeStore();

  // Fetch departments for the selected faculty
  useEffect(() => {
    if (facultyId) {
      fetchDepartments(facultyId);
    }
  }, [facultyId, fetchDepartments]);

  const handleDepartmentPress = (department) => {
    router.push({
      pathname: '/(questions)/levels',
      params: {
        departmentId: department.id,
        departmentName: department.name,
        departmentCode: department.code,
        facultyId,
        facultyName,
        facultyCode,
      },
    });
  };

  const renderDepartment = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.departmentCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleDepartmentPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: `${theme.primary}20`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="book-education-outline"
            size={28}
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
            {item.name}
          </Text>

          <Text
            style={[
              styles.departmentCode,
              { color: theme.textSecondary },
            ]}
          >
            {item.code}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
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
            Select Department
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            {facultyName}
          </Text>
        </View>
      </View>

      {/* Selected Faculty */}
      <View
        style={[
          styles.facultyCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.facultyIcon,
            {
              backgroundColor: `${theme.primary}20`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="school-outline"
            size={26}
            color={theme.primary}
          />
        </View>

        <View style={styles.facultyInfo}>
          <Text
            style={[
              styles.facultyName,
              { color: theme.text },
            ]}
            numberOfLines={2}
          >
            {facultyName}
          </Text>

          <Text
            style={[
              styles.facultyCode,
              { color: theme.textSecondary },
            ]}
          >
            {facultyCode}
          </Text>
        </View>
      </View>

      {/* Departments */}
      <View style={styles.content}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.text },
          ]}
        >
          Departments
        </Text>

        {isLoadingDepartments ? (
          <View style={styles.centered}>
            <ActivityIndicator
              size="large"
              color={theme.primary}
            />

            <Text
              style={[
                styles.loadingText,
                { color: theme.textSecondary },
              ]}
            >
              Loading departments...
            </Text>
          </View>
        ) : departments.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="school-outline"
              size={45}
              color={theme.textSecondary}
            />

            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text },
              ]}
            >
              No departments available
            </Text>

            <Text
              style={[
                styles.emptyText,
                { color: theme.textSecondary },
              ]}
            >
              {"We couldn't find any departments"}
              for this faculty.
            </Text>

            <TouchableOpacity
              style={[
                styles.retryButton,
                {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => fetchDepartments(facultyId)}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={departments}
            renderItem={renderDepartment}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
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

  facultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 25,
  },

  facultyIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  facultyInfo: {
    flex: 1,
  },

  facultyName: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 16,
  },

  facultyCode: {
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

  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },

  iconBox: {
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

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontFamily: 'Ubuntu-Regular',
    marginTop: 10,
  },

  emptyContainer: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
    alignItems: 'center',
  },

  emptyTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 17,
    marginTop: 12,
  },

  emptyText: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 25,
    paddingVertical: 11,
    borderRadius: 10,
  },

  retryText: {
    color: '#fff',
    fontFamily: 'Ubuntu-Bold',
  },
});