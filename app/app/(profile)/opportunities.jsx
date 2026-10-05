import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../../store/themeStore';

const ASYNC_KEY = 'opportunity_notifications';

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
  );
  const router = useRouter();
  const { theme } = useThemeStore();
  
  const [notifications, setNotifications] = useState({
    scholarships: false,
    organisations: false,
    tutorials: false,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(ASYNC_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }
  };

  const toggleNotification = async (key) => {
    try {
      const newPrefs = { ...notifications, [key]: !notifications[key] };
      setNotifications(newPrefs);
      await AsyncStorage.setItem(ASYNC_KEY, JSON.stringify(newPrefs));
    } catch (e) {
      console.error('Failed to save preference:', e);
    }
  };

  const opportunities = [
    {
      id: 'scholarships',
      title: 'Scholarships',
      description: 'Finding scholarships and grants for LAUTECH students.',
      iconFam: 'Ionicons',
      iconName: 'school-outline',
    },
    {
      id: 'organisations',
      title: 'Organisations',
      description: 'Join student organisations and other communities.',
      iconFam: 'MaterialCommunityIcons',
      iconName: 'account-group-outline',
    },
    {
      id: 'tutorials',
      title: 'Tutorials',
      description: 'Class tutorials, pdfs and comprehensive study materials.',
      iconFam: 'Ionicons',
      iconName: 'play-circle-outline',
    },
  ];

  const renderIcon = (fam, name, color) => {
    if (fam === 'Ionicons') {
      return <Ionicons name={name} size={32} color={color} />;
    }
    return <MaterialCommunityIcons name={name} size={32} color={color} />;
  };

  return (
    <SafeAreaView style={[
        styles.container, { backgroundColor: theme.background },
        { paddingTop: topInset },
      ]}
     edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Opportunities
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {opportunities.map((item) => (
          <View 
            key={item.id} 
            style={[
              styles.card, 
              { backgroundColor: theme.card, borderColor: theme.border }
            ]}
          >
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>Coming Soon</Text>
            </View>

            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                {renderIcon(item.iconFam, item.iconName, theme.primary)}
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {item.title}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              {item.description}
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.notifyRow}>
              <Text style={[styles.notifyLabel, { color: theme.text }]}>
                Notify me when available
              </Text>
              <Switch
                value={notifications[item.id]}
                onValueChange={() => toggleNotification(item.id)}
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={notifications[item.id] ? theme.primary : theme.textSecondary}
              />
            </View>
          </View>
        ))}

        <Text style={[styles.bottomNote, { color: theme.textSecondary }]}>
          We will notify you when these features become available.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
  },
  headerTitle: {
    fontFamily: 'Archivo-Black',
    fontSize: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFB020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 15,
  },
  badgeText: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 10,
    color: '#000000',
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Ubuntu-Bold',
    fontSize: 18,
  },
  cardDescription: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 15,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifyLabel: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 14,
  },
  bottomNote: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
});
