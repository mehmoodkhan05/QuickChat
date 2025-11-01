import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Parse from '../config/parse';

export default function ChatList({ navigation }) {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);

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

      const Chat = Parse.Object.extend('Chat');
      const chat = new Chat();
      chat.set('participants', [currentUser]);
      await chat.save();
      loadChats(); // Refresh chat list
      navigation.navigate('ChatScreen', { chatId: chat.id });
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const renderChat = ({ item }) => {
    const currentUser = Parse.User.current();
    const participants = item.get('participants');
    const otherUser = participants.find(p => p.id !== currentUser.id);

    const chatTitle = otherUser ? otherUser.get('username') : `Chat ${item.id.slice(-6)}`;
    const profileImageUrl = otherUser && otherUser.get('profilePic') ? otherUser.get('profilePic').url() : 'https://via.placeholder.com/150';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatScreen', { 
          chatId: item.id, 
          otherUser: otherUser ? { username: otherUser.get('username'), profilePicUrl: profileImageUrl } : null 
        })}
      >
        <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
        <View style={styles.chatInfo}>
            <Text style={styles.chatTitle}>{chatTitle}</Text>
            <Text style={styles.lastMessage}>
                {item.get('lastMessage') ? item.get('lastMessage').get('text') : 'No messages yet'}
            </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {/* Search Bar with New Chat Button */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.newChatButton} onPress={createChat}>
          <Ionicons name="create" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats found</Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navButton, styles.activeNavButton]}>
          <View style={styles.navButtonContent}>
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={[styles.navButtonText, styles.activeNavText]}>Chats</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <View style={styles.navButtonContent}>
            <Ionicons name="call" size={20} color="#666" />
            <Text style={styles.navButtonText}>Calls</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <View style={styles.navButtonContent}>
            <Ionicons name="settings" size={20} color="#666" />
            <Text style={styles.navButtonText}>Settings</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeNavButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeNavText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  navButtonContent: {
    alignItems: 'center',
  },
});
