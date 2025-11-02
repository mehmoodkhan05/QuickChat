import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Parse from '../config/parse';
import { Swipeable } from 'react-native-gesture-handler';

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

export default function ChatList({ navigation }) {
  const [activeTab, setActiveTab] = useState('Chats');
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const swipeableRefs = useRef([]);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat =>
        chat.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.get('lastMessage') && chat.get('lastMessage').get('text').toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredChats(filtered);
    }
  }, [chats, searchQuery]);

  const loadChats = async () => {
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) {
        console.error('No current user');
        return;
      }

      const Chat = Parse.Object.extend('Chat');
      const query = new Parse.Query(Chat);
      query.equalTo('participants', currentUser);
      query.include('participants');
      query.include('lastMessage');
      query.descending('updatedAt');
      const results = await query.find();
      setChats(results);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const createChat = async () => {
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) {
        console.error('No current user');
        return;
      }

      // For demonstration, let's create a chat with a dummy user
      const User = Parse.Object.extend('_User');
      const query = new Parse.Query(User);
      query.notEqualTo("objectId", currentUser.id);
      const dummyUser = await query.first();

      if(!dummyUser) {
          console.error("No other users to create a chat with.");
          return;
      }

      const Chat = Parse.Object.extend('Chat');
      const chat = new Chat();
      chat.set('participants', [currentUser, dummyUser]);
      await chat.save();
      loadChats(); // Refresh chat list
      navigation.navigate('ChatScreen', { chatId: chat.id, otherUser: { username: dummyUser.get('username'), profilePicUrl: dummyUser.get('profilePic')?.url() } });
    } catch (error) {
      console.error('Error creating chat:', error);
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
      console.error('Error deleting chat:', error);
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

    const chatTitle = otherUser ? otherUser.get('username') : `Chat ${item.id.slice(-6)}`;
    const profileImageUrl = otherUser && otherUser.get('profilePic') ? otherUser.get('profilePic').url() : null;

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
            otherUser: otherUser ? { username: otherUser.get('username'), profilePicUrl: profileImageUrl } : null 
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

    const chatTitle = otherUser ? otherUser.get('username') : `Chat ${item.id.slice(-6)}`;
    const profileImageUrl = otherUser && otherUser.get('profilePic') ? otherUser.get('profilePic').url() : null;

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
                    otherUser: otherUser ? { username: otherUser.get('username'), profilePicUrl: profileImageUrl } : null 
                })}>
                    <Ionicons name="chatbubbles-outline" size={24} color="#8e8e93" />
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  const renderSetting = ({ item }) => (
    <TouchableOpacity style={styles.settingItem}>
        <Ionicons name={item.icon} size={24} color="#007AFF" style={styles.settingIcon} />
        <Text style={styles.settingTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
      switch(activeTab) {
          case 'Chats':
              return (
                <FlatList
                    data={filteredChats}
                    renderItem={renderChat}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    style={styles.list}
                    ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No chats found</Text>
                    </View>
                    }
                />
              );
            case 'Calls':
                return (
                    <FlatList
                        data={chats}
                        renderItem={renderCall}
                        keyExtractor={(item) => item.id}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                );
            case 'Settings':
                return (
                    <FlatList
                        data={dummySettings}
                        renderItem={renderSetting}
                        keyExtractor={(item) => item.id}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                );
      }
  }

  return (
    <View style={styles.container}>
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
      </View>

      {/* Search Bar */}
        <View style={styles.searchContainer}>
            <TextInput
                style={styles.searchInput}
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {activeTab === 'Chats' && <TouchableOpacity style={styles.newChatButton} onPress={createChat}>
            <Ionicons name="create" size={24} color="#8e8e93" />
            </TouchableOpacity>}
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
    marginRight: 10,
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
    paddingVertical: 5,
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
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  callInfo: {
    flex: 1,
    marginLeft: 15,
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
