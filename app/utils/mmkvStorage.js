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

// Global user faculty cache across sessions
const INITIAL_FACULTY_MAP = {
  abdullateef: 'FCI',
  shineon816_3521: 'FASS',
};

export function getGlobalUserFaculty(username) {
  if (!username) return null;
  const key = username.toLowerCase().trim();
  try {
    const raw = storage.getString('user_faculty_map');
    const map = raw ? JSON.parse(raw) : INITIAL_FACULTY_MAP;
    return map[key] || INITIAL_FACULTY_MAP[key] || null;
  } catch (e) {
    return INITIAL_FACULTY_MAP[key] || null;
  }
}

export function saveGlobalUserFaculty(username, facultyCode) {
  if (!username || !facultyCode) return;
  const key = username.toLowerCase().trim();
  try {
    const raw = storage.getString('user_faculty_map');
    const map = raw ? JSON.parse(raw) : { ...INITIAL_FACULTY_MAP };
    map[key] = facultyCode.toString().toUpperCase().trim();
    storage.set('user_faculty_map', JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save user faculty mapping:', e);
  }
}