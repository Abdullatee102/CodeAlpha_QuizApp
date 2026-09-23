import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useRouter,
} from 'expo-router';

import {
  useThemeStore,
} from '../../store/themeStore';

export default function AppearanceScreen() {
  const router = useRouter();

  const {
    appearance,
    setAppearance,
    theme,
  } = useThemeStore();

  const options = [
    {
      key: 'system',
      title: 'System Default',
      description:
        'Use your device appearance setting',
      icon: 'phone-portrait-outline',
    },
    {
      key: 'light',
      title: 'Light',
      description:
        'Always use light appearance',
      icon: 'sunny-outline',
    },
    {
      key: 'dark',
      title: 'Dark',
      description:
        'Always use dark appearance',
      icon: 'moon-outline',
    },
  ];

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
      edges={[
        'top',
        'bottom',
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.backButton}
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
                theme.text,
            },
          ]}
        >
          Appearance
        </Text>

        <View
          style={styles.headerSpacer}
        />
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          Choose Appearance
        </Text>

        <View
          style={[
            styles.optionsContainer,
            {
              borderColor:
                theme.border,
            },
          ]}
        >
          {options.map(
            (
              option,
              index
            ) => {
              const selected =
                appearance ===
                option.key;

              return (
                <TouchableOpacity
                  key={
                    option.key
                  }
                  activeOpacity={
                    0.7
                  }
                  onPress={() =>
                    setAppearance(
                      option.key
                    )
                  }
                  style={[
                    styles.option,
                    {
                      borderBottomColor:
                        theme.border,
                      borderBottomWidth:
                        index ===
                        options.length -
                          1
                          ? 0
                          : 1,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.optionLeft
                    }
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor:
                            selected
                              ? `${theme.primary}18`
                              : `${theme.textSecondary}10`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          option.icon
                        }
                        size={22}
                        color={
                          selected
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.optionTextContainer
                      }
                    >
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color:
                              theme.text,
                          },
                        ]}
                      >
                        {
                          option.title
                        }
                      </Text>

                      <Text
                        style={[
                          styles.optionDescription,
                          {
                            color:
                              theme.textSecondary,
                          },
                        ]}
                      >
                        {
                          option.description
                        }
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor:
                          selected
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    {selected && (
                      <View
                        style={[
                          styles.radioInner,
                          {
                            backgroundColor:
                              theme.primary,
                          },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    header: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingHorizontal:
        20,
      paddingVertical:
        14,
    },

    backButton: {
      width: 40,
      height: 40,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    headerTitle: {
      flex: 1,
      textAlign:
        'center',
      fontFamily:
        'Ubuntu-Bold',
      fontSize: 20,
    },

    headerSpacer: {
      width: 40,
    },

    content: {
      paddingHorizontal:
        20,
      paddingTop:
        15,
    },

    sectionTitle: {
      fontFamily:
        'Ubuntu-Bold',
      fontSize: 13,
      textTransform:
        'uppercase',
      marginBottom:
        12,
    },

    optionsContainer: {
      borderWidth: 1,
      borderRadius: 16,
      overflow:
        'hidden',
    },

    option: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      paddingHorizontal:
        16,
      paddingVertical:
        18,
    },

    optionLeft: {
      flexDirection:
        'row',
      alignItems:
        'center',
      flex: 1,
    },

    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight:
        14,
    },

    optionTextContainer: {
      flex: 1,
    },

    optionTitle: {
      fontFamily:
        'Ubuntu-Medium',
      fontSize: 16,
    },

    optionDescription: {
      fontFamily:
        'Ubuntu-Regular',
      fontSize: 12,
      marginTop: 4,
    },

    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginLeft: 12,
    },

    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  });