import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import Parse from './config/parse';
import Login from './screens/Login';
import ChatList from './screens/ChatList';
import ChatScreen from './screens/ChatScreen';
import NewChat from './screens/NewChat';
import EnterName from './screens/EnterName';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="ChatList" component={ChatList} options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewChat" component={NewChat} options={{ headerShown: false }} />
        <Stack.Screen name="EnterName" component={EnterName} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
