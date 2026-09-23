import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { onboardingPages } from '../data/onboard';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollClick = useRef(null);
  const router = useRouter();

  const setHasFinishedOnboarding = useAuthStore(
    (state) => state.setHasFinishedOnboarding
  );

  const { theme } = useThemeStore();

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNext = async () => {
    if (currentIndex < onboardingPages.length - 1) {
      scrollClick.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      setHasFinishedOnboarding(true);

      router.replace('/(auth)/sign-up');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.page}>
      <Image
        source={item.image}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            {
              color: theme.primary,
            },
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.text,
            },
          ]}
        >
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <FlatList
        data={onboardingPages}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={scrollClick}
        keyExtractor={(item) => item.id}
      />

      {/* Pagination & Footer */}
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {onboardingPages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: theme.border,
                },
                currentIndex === index && [
                  styles.activeIndicator,
                  {
                    backgroundColor: theme.primary,
                  },
                ],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === onboardingPages.length - 1
              ? 'Get Started'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  page: {
    width: width,
    alignItems: 'center',
    padding: 20,
  },

  image: {
    width: width * 0.8,
    height: height * 0.45,
    marginTop: 40,
  },

  textContainer: {
    marginTop: 40,
    alignItems: 'center',
  },

  title: {
    fontFamily: 'Archivo-Black',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
  },

  subtitle: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  footer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },

  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },

  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },

  activeIndicator: {
    width: 25,
  },

  button: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },

  buttonText: {
    fontFamily: 'Ubuntu-Bold',
    color: Colors.white,
    fontSize: 18,
  },
});