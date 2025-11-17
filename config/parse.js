import Parse from 'parse/dist/parse.min.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Polyfill crypto.getRandomValues for Parse SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array) => {
      const randomBytes = Crypto.getRandomBytes(array.length);
      for (let i = 0; i < array.length; i++) {
        array[i] = randomBytes[i];
      }
      return array;
    }
  };
}

// Polyfill localStorage for Parse SDK (only for non-web platforms)
// Check if we're on web by checking if window.localStorage exists
const isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

if (!isWeb && typeof global.localStorage === 'undefined') {
  global.localStorage = {
    getItem: async (key) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.error('localStorage.getItem error:', error);
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('localStorage.setItem error:', error);
      }
    },
    removeItem: async (key) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('localStorage.removeItem error:', error);
      }
    }
  };
}

// Only set AsyncStorage for non-web platforms (web uses localStorage directly)
if (!isWeb) {
  Parse.setAsyncStorage(AsyncStorage);
}
Parse.initialize('bt8q6tlNoDTwlWDsoM3A6QbW9iKDKrs9YJXbgOcZ', 'U5WachqE4CNKUut0GbwQwd8RXsGVRr5UwqDpL97o');
Parse.serverURL = 'https://parseapi.back4app.com';

export default Parse;
