import AsyncStorage from '@react-native-async-storage/async-storage';
import Parse from '../config/parse';

const SESSION_KEY = '@quickchat_session';

export const saveSession = async ({ username, password }) => {
  if (!username || !password) {
    return;
  }
  try {
    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username, password })
    );
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const getSavedSession = async () => {
  try {
    const storedValue = await AsyncStorage.getItem(SESSION_KEY);
    if (!storedValue) {
      return null;
    }
    return JSON.parse(storedValue);
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

export const tryRestoreUser = async () => {
  try {
    const session = await getSavedSession();
    if (session?.username && session?.password) {
      const currentUser = Parse.User.current();
      if (currentUser && currentUser.get('username') === session.username) {
        return currentUser;
      }
      const loggedIn = await Parse.User.logIn(
        session.username,
        session.password
      );
      return loggedIn;
    }
  } catch (error) {
    console.error('Error restoring session:', error);
  }
  return null;
};

