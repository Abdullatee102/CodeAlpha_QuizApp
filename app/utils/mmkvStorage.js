import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

// Polyfill .delete() to map to .remove() for v4 compatibility
if (!storage.delete && storage.remove) {
  storage.delete = (key) => storage.remove(key);
}

export const mmkvStorage = {
  setItem: (name, value) => {
    storage.set(name, value);
  },

  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },

  removeItem: (name) => {
    storage.remove(name);
  },
};