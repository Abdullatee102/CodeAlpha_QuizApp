import React from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function LiveChatScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  
  const TAWK_TO_URL = 'https://tawk.to/chat/69e402356936c61c3874666d/1jmhah8ud';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Live Support</Text>
        <View style={{ width: 28 }} />
      </View>

      <WebView 
        source={{ uri: TAWK_TO_URL }}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loading} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: 'Ubuntu-Bold', fontSize: 18 },
  loading: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20 }
});