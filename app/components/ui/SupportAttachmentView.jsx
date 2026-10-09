// app/components/ui/SupportAttachmentView.jsx
import React, { useState, useEffect } from 'react';
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
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { storage } from '../../utils/mmkvStorage';
import api from '../../data/api';

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
  const apiUrl =
    api?.defaults?.baseURL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://quizbackend-1-wxdb.onrender.com/api';
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

  const [cachedUri, setCachedUri] = useState(attachment?.localUri || null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const fileName = attachment?.fileName || 'Attachment';
  const fileSizeStr = formatFileSize(attachment?.size);
  const isImage =
    !attachment?.mimeType ||
    attachment?.mimeType?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);

  useEffect(() => {
    let isMounted = true;

    if (!attachment) {
      setIsLoading(false);
      return;
    }

    if (attachment.localUri) {
      setCachedUri(attachment.localUri);
      setIsLoading(false);
      return;
    }

    const loadAndCacheImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const fullUrl = getFullAttachmentUrl(attachment.url);
        if (!fullUrl) {
          throw new Error('Attachment URL missing');
        }

        const safeId = String(attachment.id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
        const extMatch = (attachment.fileName || '').match(/\.[a-zA-Z0-9]+$/);
        const ext = extMatch ? extMatch[0] : '.jpg';
        const localPath = `${FileSystem.cacheDirectory}support_att_${safeId}${ext}`;

        // Check if file already exists in local cache
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && fileInfo.size > 0) {
          if (isMounted) {
            setCachedUri(localPath);
            setIsLoading(false);
          }
          return;
        }

        // Authenticated download via FileSystem
        const authHeader = token ? `Bearer ${token}` : undefined;
        const downloadRes = await FileSystem.downloadAsync(fullUrl, localPath, {
          headers: authHeader ? { Authorization: authHeader } : undefined,
        });

        if (downloadRes.status >= 200 && downloadRes.status < 300) {
          if (isMounted) {
            setCachedUri(downloadRes.uri);
            setIsLoading(false);
          }
        } else {
          console.warn(`[SUPPORT ATTACHMENT] Download failed with status ${downloadRes.status}`);
          // Fall back to direct URL with auth header if download status wasn't 2xx
          if (isMounted) {
            setCachedUri(fullUrl);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.warn('[SUPPORT ATTACHMENT] Load/Cache error:', err?.message || err);
        if (isMounted) {
          const directUrl = getFullAttachmentUrl(attachment.url);
          if (directUrl) {
            setCachedUri(directUrl);
            setIsLoading(false);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }
      }
    };

    loadAndCacheImage();

    return () => {
      isMounted = false;
    };
  }, [attachment?.id, attachment?.url, attachment?.localUri, token]);

  if (!attachment) return null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          isUserMessage
            ? styles.containerMe
            : [
                styles.containerOther,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderColor: theme.border,
                },
              ],
        ]}
        activeOpacity={0.85}
        onPress={() => {
          if (isImage && !hasError && cachedUri) {
            setIsViewerVisible(true);
          }
        }}
      >
        {isImage ? (
          <View style={styles.imageWrapper}>
            {cachedUri && !hasError ? (
              <Image
                source={{
                  uri: cachedUri,
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={(e) => {
                  console.warn('[SUPPORT ATTACHMENT] Render error:', e?.error || e);
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            ) : null}

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator
                  size="small"
                  color={isUserMessage ? '#FFFFFF' : theme.primary}
                />
              </View>
            )}

            {hasError && (
              <View
                style={[
                  styles.errorOverlay,
                  { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' },
                ]}
              >
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.errorText, { color: theme.textSecondary }]}
                >
                  Preview unavailable
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.fileIconWrap,
              { backgroundColor: `${theme.primary}18` },
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={theme.primary}
            />
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
              {
                color: isUserMessage
                  ? 'rgba(255,255,255,0.7)'
                  : theme.textSecondary,
              },
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
        <SafeAreaView
          style={styles.modalBackdrop}
          edges={['top', 'bottom', 'left', 'right']}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

          {/* Header Bar */}
          <View style={styles.viewerHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {fileName}
              </Text>
              <Text style={styles.viewerSubtitle}>{fileSizeStr}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsViewerVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Full Image */}
          <View style={styles.viewerImageWrap}>
            {cachedUri ? (
              <Image
                source={{
                  uri: cachedUri,
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }}
                style={styles.fullImage}
                contentFit="contain"
              />
            ) : (
              <ActivityIndicator size="large" color="#FFFFFF" />
            )}
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
    marginTop: 6,
    width: 210,
    maxWidth: '100%',
  },
  containerMe: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  errorText: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  fileIconWrap: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  fileName: {
    fontFamily: 'Ubuntu-Medium',
    fontSize: 11,
    flex: 1,
  },
  fileSize: {
    fontFamily: 'Ubuntu-Regular',
    fontSize: 10,
  },

  // Modal Lightbox Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    padding: 4,
  },
  viewerImageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
