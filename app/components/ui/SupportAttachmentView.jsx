// app/components/ui/SupportAttachmentView.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { storage } from '../../utils/mmkvStorage';

export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function getFullAttachmentUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
}

export default function SupportAttachmentView({
  attachment,
  theme,
  isDarkMode = false,
  isUserMessage = false,
}) {
  const storeToken = useAuthStore((state) => state.token);
  const token = storeToken || storage.getString('userToken');

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  if (!attachment) return null;

  const fullUrl = getFullAttachmentUrl(attachment.url);
  const fileName = attachment.fileName || 'Attachment';
  const fileSizeStr = formatFileSize(attachment.size);
  const isImage = !attachment.mimeType || attachment.mimeType.startsWith('image/');

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          isUserMessage
            ? styles.containerMe
            : [styles.containerOther, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.border }],
        ]}
        activeOpacity={0.85}
        onPress={() => {
          if (isImage && !hasError) {
            setIsViewerVisible(true);
          }
        }}
      >
        {isImage ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri: fullUrl,
                headers: authHeaders,
              }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => setIsLoading(false)}
              onError={(e) => {
                console.warn('[SUPPORT ATTACHMENT] Load error:', e?.error || e);
                setIsLoading(false);
                setHasError(true);
              }}
            />

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={isUserMessage ? '#FFFFFF' : theme.primary} />
              </View>
            )}

            {hasError && (
              <View style={[styles.errorOverlay, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                <Ionicons name="image-outline" size={24} color={theme.textSecondary} />
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                  Preview unavailable
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.fileIconWrap, { backgroundColor: `${theme.primary}18` }]}>
            <Ionicons name="document-text-outline" size={24} color={theme.primary} />
          </View>
        )}

        <View style={styles.metaRow}>
          <Ionicons
            name="attach-outline"
            size={13}
            color={isUserMessage ? 'rgba(255,255,255,0.85)' : theme.textSecondary}
          />
          <Text
            style={[
              styles.fileName,
              { color: isUserMessage ? '#FFFFFF' : theme.text },
            ]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
          <Text
            style={[
              styles.fileSize,
              { color: isUserMessage ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
            ]}
          >
            ({fileSizeStr})
          </Text>
        </View>
      </TouchableOpacity>

      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      <Modal
        visible={isViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsViewerVisible(false)}
      >
        <SafeAreaView style={styles.modalBackdrop} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          {/* Header Bar */}
          <View style={styles.viewerHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {fileName}
              </Text>
              <Text style={styles.viewerSubtitle}>
                {fileSizeStr}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsViewerVisible(false)}
              activeOpacity={0.7}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Large Image Preview */}
          <View style={styles.viewerBody}>
            <Image
              source={{
                uri: fullUrl,
                headers: authHeaders,
              }}
              style={styles.fullImage}
              contentFit="contain"
              transition={200}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 4,
    maxWidth: 240,
  },
  containerMe: {
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  containerOther: {
    borderWidth: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'Ubuntu-Regular',
    marginTop: 4,
  },
  fileIconWrap: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  fileName: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 12,
    flexShrink: 1,
  },
  fileSize: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 10,
  },

  // Modal Viewer
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  viewerTitle: {
    color: '#FFFFFF',
    fontFamily: 'Ubuntu-Bold',
    fontSize: 15,
  },
  viewerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Ubuntu-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

