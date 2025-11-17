import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image, Animated, Modal, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Parse from '../config/parse';
import { Swipeable } from 'react-native-gesture-handler';
import { tryRestoreUser, clearSession } from '../utils/session';

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
  {
    id: '7',
    title: 'Logout',
    icon: 'log-out-outline',
  },
];

export default function ChatList({ navigation }) {
  const [activeTab, setActiveTab] = useState('Chats');
  const [chats, setChats] = useState([]);
  const [calls, setCalls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  const swipeableRefs = useRef([]);

  const handleInvalidSession = async (retryAction) => {
    const restoredUser = await tryRestoreUser();
    if (restoredUser && typeof retryAction === 'function') {
      await retryAction();
      return;
    }
    try {
      await Parse.User.logOut();
    } catch (logoutError) {
      // Error logging out after invalid session
    }
    await clearSession();
    Alert.alert('Session expired', 'Please log in again.');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Load chats when screen comes into focus (including initial mount)
  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [])
  );

  const loadChats = async () => {
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) {
        return;
      }

      const Chat = Parse.Object.extend('Chat');
      const query = new Parse.Query(Chat);
      // Only get chats where current user is a participant
      query.equalTo('participants', currentUser);
      query.include('participants');
      query.include('participants.profilePic');
      query.include('lastMessage');
      query.descending('updatedAt');
      
      const results = await query.find();
      
      // Double-check: filter to ensure only chats with current user are included
      const validChats = results.filter(chat => {
        const participants = chat.get('participants');
        if (!participants || !Array.isArray(participants)) return false;
        return participants.some(p => p.id === currentUser.id);
      });
      
      setChats(validChats);
      setCalls(validChats); // Using same data for calls for now
    } catch (error) {
      if (error.code === Parse.Error.INVALID_SESSION_TOKEN || error.code === 209) {
        await handleInvalidSession(() => loadChats());
        return;
      }
      // On error, set empty array to ensure no invalid chats are shown
      setChats([]);
      setCalls([]);
    }
  };

  const confirmDelete = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  const deleteChat = async () => {
    try {
      const Chat = Parse.Object.extend('Chat');
      const query = new Parse.Query(Chat);
      const chat = await query.get(selectedChat.id);
      await chat.destroy();
      setModalVisible(false);
      loadChats(); // Refresh chat list
    } catch (error) {
      if (error.code === Parse.Error.INVALID_SESSION_TOKEN || error.code === 209) {
        await handleInvalidSession(() => deleteChat());
        return;
      }
      Alert.alert('Error', 'Could not delete chat.');
    }
  };


  const handleLogout = async () => {
    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        await Parse.User.logOut();
      }
      await clearSession();
      navigation.replace('Login');
    } catch (error) {
      navigation.replace('Login');
    }
  };

  const renderRightActions = (progress, dragX, chat, index) => {
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => {
          swipeableRefs.current[index].close();
          confirmDelete(chat)
        }}>
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderChat = ({ item, index }) => {
    const currentUser = Parse.User.current();
    const participants = item.get('participants');
    const otherUser = participants.find(p => p.id !== currentUser.id);

    const chatTitle = otherUser ? otherUser.get('name') || otherUser.get('username') : `Chat ${item.id.slice(-6)}`;
    const profileImage = otherUser.get('profilePic');
    const profileImageUrl = profileImage ? profileImage.url() : null;

    return (
      <Swipeable 
        ref={ref => swipeableRefs.current[index] = ref}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item, index)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => navigation.navigate('ChatScreen', { 
            chatId: item.id, 
            otherUser: otherUser ? { name: otherUser.get('name'), username: otherUser.get('username'), profilePicUrl: profileImageUrl } : null 
          })}
        >
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.defaultProfile} >
                <Ionicons name="person" size={24} color="white" />
            </View>
          )}
          <View style={styles.chatInfo}>
              <Text style={styles.chatTitle}>{chatTitle}</Text>
              <Text style={styles.lastMessage}>
                  {item.get('lastMessage') ? item.get('lastMessage').get('text') : 'No messages yet'}
              </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }

  const renderCall = ({ item, index }) => {
    const currentUser = Parse.User.current();
    const participants = item.get('participants');
    const otherUser = participants.find(p => p.id !== currentUser.id);

    const chatTitle = otherUser ? otherUser.get('name') || otherUser.get('username') : `Chat ${item.id.slice(-6)}`;
    const profileImage = otherUser.get('profilePic');
    const profileImageUrl = profileImage ? profileImage.url() : null;

    // Dummy call data
    const callTypes = ['incoming', 'outgoing'];
    const callType = callTypes[index % callTypes.length];
    const missedCall = (index % 3) === 0;

    return (
        <View style={styles.callItem}>
            {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            ) : (
                <View style={styles.defaultProfile} >
                    <Ionicons name="person" size={24} color="white" />
                </View>
            )}
            <View style={styles.callInfo}>
                <Text style={[styles.callName, missedCall && styles.missedCall]}>{chatTitle}</Text>
                <View style={styles.callMeta}>
                  <Ionicons
                    name={callType === 'incoming' ? 'arrow-down-outline' : 'arrow-up-outline'}
                    size={16}
                    color={missedCall ? 'red' : '#666'}
                  />
                  <Text style={styles.callTime}>Yesterday</Text>
                </View>
            </View>
            <View style={styles.callButtons}>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="call" size={24} color="#8e8e93" />
                </TouchableOpacity>
                <TouchableOpacity style={{marginLeft: 20}} onPress={() => navigation.navigate('ChatScreen', { 
                    chatId: item.id, 
                    otherUser: otherUser ? { name: otherUser.get('name'), username: otherUser.get('username'), profilePicUrl: profileImageUrl } : null 
                })}>
                    <Ionicons name="chatbubbles-outline" size={24} color="#8e8e93" />
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  const renderSetting = ({ item }) => {
    const handlePress = () => {
      if (item.title === 'Logout') {
        handleLogout();
      } else if (item.title === 'Account') {
        navigation.navigate('ProfileScreen');
      }
    };

    return (
      <TouchableOpacity style={styles.settingItem} onPress={handlePress}>
          <Ionicons name={item.icon} size={24} color={item.title === 'Logout' ? 'red' : '#007AFF'} style={styles.settingIcon} />
          <Text style={[styles.settingTitle, item.title === 'Logout' && styles.logoutText]}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    let data;
    let render;
    let emptyText;

    switch(activeTab) {
        case 'Chats':
            data = chats;
            render = renderChat;
            emptyText = "No chats found";
            break;
        case 'Calls':
            data = calls;
            render = renderCall;
            emptyText = "No calls found";
            break;
        case 'Settings':
            data = dummySettings;
            render = renderSetting;
            emptyText = "No settings found";
            break;
        default:
            data = [];
            render = () => null;
            emptyText = "";
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    const filteredData = data.filter(item => {
      if (!searchQuery.trim()) {
          return true;
      }
      if (activeTab === 'Settings') {
          return item.title.toLowerCase().includes(lowercasedQuery);
      }
      if (item.get) {
          const participants = item.get('participants');
          if (!participants) return false;
          const otherUser = participants.find(p => p.id !== Parse.User.current().id);
          if (otherUser) {
              const name = (otherUser.get('name') || otherUser.get('username')).toLowerCase();
              return name.includes(lowercasedQuery);
          }
      }
      return false;
    });

    return (
      <FlatList
          data={filteredData}
          renderItem={render}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => activeTab !== 'Settings' ? <View style={styles.separator} /> : null}
          style={styles.list}
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
          }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Delete chat with {selectedChat?.get('participants').find(p => p.id !== Parse.User.current().id)?.get('username')}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close-circle" size={24} color="#ccc" />
                    </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => deleteChat()}
                    >
                        <Text style={styles.modalButtonText}>Delete chat</Text>
                        <Ionicons name="trash" size={24} color="red" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeTab}</Text>
        {activeTab === 'Chats' && <TouchableOpacity style={styles.newChatButton} onPress={() => navigation.navigate('NewChat')}>
            <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>}
      </View>

      {/* Search Bar */}
        <View style={styles.searchContainer}>
            <TextInput
                style={styles.searchInput}
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>

      {/* Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('Chats')}>
          <View style={styles.navButtonContent}>
            <Ionicons name={activeTab === 'Chats' ? 'chatbubbles' : 'chatbubbles-outline'} size={32} color={activeTab === 'Chats' ? 'black' : '#8e8e93'} />
            <Text style={[styles.navButtonText, activeTab === 'Chats' && styles.activeNavText]}>Chats</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('Calls')}>
          <View style={styles.navButtonContent}>
            <Ionicons name={activeTab === 'Calls' ? 'call' : 'call-outline'} size={32} color={activeTab === 'Calls' ? 'black' : '#8e8e93'} />
            <Text style={[styles.navButtonText, activeTab === 'Calls' && styles.activeNavText]}>Calls</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('Settings')}>
          <View style={styles.navButtonContent}>
            <Ionicons name={activeTab === 'Settings' ? 'settings' : 'settings-outline'} size={32} color={activeTab === 'Settings' ? 'black' : '#8e8e93'} />
            <Text style={[styles.navButtonText, activeTab === 'Settings' && styles.activeNavText]}>Settings</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    fontSize: 16,
  },
  newChatButton: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
  },
  defaultProfile: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
      flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  missedCall: {
    color: 'red',
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  callTime: {
    marginLeft: 5,
    color: '#666',
  },
  callButtons: {
    flexDirection: 'row',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
  },
  logoutText: {
      color: 'red',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    paddingBottom: 25,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeNavButton: {
  },
  navButtonText: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 2,
  },
  activeNavText: {
    color: 'black',
    fontWeight: 'bold',
    marginTop: 2,
  },
  navButtonContent: {
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteButtonText: {
    color: 'white',
    marginTop: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 80,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    color: '#666',
  },
  modalBody: {
      backgroundColor: 'white',
      borderRadius: 10,
  },
  modalButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: 'red',
    fontSize: 16,
  },
});
