import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import Parse from '../config/parse';
import { Ionicons } from '@expo/vector-icons';

export default function NewChat({ navigation }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const currentUser = Parse.User.current();
        const userQuery = new Parse.Query(Parse.User);
        userQuery.notEqualTo('objectId', currentUser.id);
        userQuery.include('profilePic');
        const results = await userQuery.find();
        setUsers(results);
        setFilteredUsers(results);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = users.filter(user => {
        const name = (user.get('name') || '').toLowerCase();
        const username = (user.get('username') || '').toLowerCase();
        return name.includes(lowercasedQuery) || username.includes(lowercasedQuery);
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const createChat = async (otherUser) => {
    try {
        const currentUser = Parse.User.current();
        const Chat = Parse.Object.extend('Chat');
        const query = new Parse.Query(Chat);
        query.containedIn('participants', [currentUser, otherUser]);
        const existingChat = await query.first();
        const profileImage = otherUser.get('profilePic');
        const profileImageUrl = profileImage ? profileImage.url() : null;

        if (existingChat) {
            navigation.navigate('ChatScreen', { chatId: existingChat.id, otherUser: { name: otherUser.get('name'), username: otherUser.get('username'), profilePicUrl: profileImageUrl } });
        } else {
            const newChat = new Chat();
            newChat.set('participants', [currentUser, otherUser]);
            await newChat.save();
            navigation.navigate('ChatScreen', { chatId: newChat.id, otherUser: { name: otherUser.get('name'), username: otherUser.get('username'), profilePicUrl: profileImageUrl } });
        }
    } catch (error) {
      console.error('Error creating or opening chat:', error);
    }
  };

  const renderUser = ({ item }) => {
    const profileImage = item.get('profilePic');
    const profileImageUrl = profileImage ? profileImage.url() : null;

    return (
      <TouchableOpacity style={styles.userItem} onPress={() => createChat(item)}>
        {profileImageUrl ? (
          <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultProfile}>
            <Ionicons name="person" size={24} color="white" />
          </View>
        )}
        <Text style={styles.userName}>{item.get('name') || item.get('username')}</Text>
      </TouchableOpacity>
    )
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Chat</Text>
        </View>
        <View style={styles.searchContainer}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 10,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    searchContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 15,
        backgroundColor: '#f8f8f8',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
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
    userName: {
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginLeft: 80,
    },
});
