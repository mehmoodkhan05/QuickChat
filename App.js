import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import Parse from './config/parse';
import Login from './screens/Login';
import ChatList from './screens/ChatList';
import ChatScreen from './screens/ChatScreen';
import NewChat from './screens/NewChat';
import EnterName from './screens/EnterName';
import { tryRestoreUser } from './utils/session';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await Parse.User.currentAsync();
        if (currentUser) {
          const targetRoute = currentUser.get('isRegistered') ? 'ChatList' : 'EnterName';
          setInitialRoute(targetRoute);
          return;
        }
        const restoredUser = await tryRestoreUser();
        if (restoredUser) {
          const targetRoute = restoredUser.get('isRegistered') ? 'ChatList' : 'EnterName';
          setInitialRoute(targetRoute);
          return;
        }
      } catch (error) {
        console.error('Error determining initial route:', error);
      }
      setInitialRoute('Login');
    };

    initialize();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={ChatList} options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewChat" component={NewChat} options={{ headerShown: false }} />
        <Stack.Screen name="EnterName" component={EnterName} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
