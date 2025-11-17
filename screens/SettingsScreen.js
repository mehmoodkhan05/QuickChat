import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const dummySettings = [
  {
    id: '1',
    title: 'Account',
    icon: 'person-circle-outline',
  },
  {
    id: '2',
    title: 'Chats',
    icon: 'chatbubbles-outline',
  },
  {
    id: '3',
    title: 'Notifications',
    icon: 'notifications-outline',
  },
  {
    id: '4',
    title: 'Storage and Data',
    icon: 'folder-outline',
  },
  {
    id: '5',
    title: 'Help',
    icon: 'help-circle-outline',
  },
  {
    id: '6',
    title: 'Invite a Friend',
    icon: 'person-add-outline',
  },
];

export default function SettingsScreen({ navigation }) {
  const handleSettingPress = (item) => {
    if (item.id === '1' && item.title === 'Account') {
      navigation.navigate('ProfileScreen');
    }
  };

  const renderSetting = ({ item }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={() => handleSettingPress(item)}
      activeOpacity={0.7}
    >
        <Ionicons name={item.icon} size={24} color="#007AFF" style={styles.settingIcon} />
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <FlatList
        data={dummySettings}
        renderItem={renderSetting}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  chevron: {
    marginLeft: 'auto',
  },
  settingIcon: {
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 54,
  },
});
