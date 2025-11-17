import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import Parse from '../config/parse';
import { Ionicons } from '@expo/vector-icons';

export default function NewChat({ navigation }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const currentUser = Parse.User.current();
        if (!currentUser) {
          setError('Please log in to see users');
          setIsLoading(false);
          return;
        }
        
        const userQuery = new Parse.Query(Parse.User);
        userQuery.notEqualTo('objectId', currentUser.id);
        userQuery.include('profilePic');
        userQuery.ascending('name');
        userQuery.limit(1000);
        
        const allUsers = await userQuery.find();
        
        if (allUsers.length === 0) {
          setError('No users found. This may be a permissions issue. Please check Parse server settings.');
          setUsers([]);
          setFilteredUsers([]);
          return;
        }
        
        const registeredUsers = allUsers.filter(user => {
          return user.get('isRegistered') === true;
        });
        
        if (registeredUsers.length === 0 && allUsers.length > 0) {
          setError(`Found ${allUsers.length} users but none are registered. Make sure users have completed registration.`);
        }
        
        setUsers(registeredUsers);
        setFilteredUsers(registeredUsers);
        setError(null);
      } catch (error) {
        let errorMessage = 'Failed to load users';
        if (error.code === 119) {
          errorMessage = 'Permission denied. Please check Parse server permissions.';
        } else if (error.code === 101) {
          errorMessage = 'No users found';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUsers();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase().trim();
      const filtered = users.filter(user => {
        const name = (user.get('name') || '').toLowerCase();
        // Search primarily by name, fallback to username if name is empty
        return name.includes(lowercasedQuery) || (name === '' && (user.get('username') || '').toLowerCase().includes(lowercasedQuery));
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const createChat = async (otherUser) => {
    try {
        const currentUser = Parse.User.current();
        const Chat = Parse.Object.extend('Chat');
        const query = new Parse.Query(Chat);
        query.equalTo('participants', currentUser);
        query.include('participants');
        const chats = await query.find();
        
        // Find chat where both current user and other user are participants
        const existingChat = chats.find(chat => {
          const participants = chat.get('participants');
          if (!participants || participants.length !== 2) return false;
          const participantIds = participants.map(p => p.id);
          return participantIds.includes(currentUser.id) && participantIds.includes(otherUser.id);
        });
        
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
      // Error creating or opening chat
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
            <TouchableOpacity onPress={fetchUsers} style={styles.refreshButton}>
                <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              setIsLoading(true);
              const fetchUsers = async () => {
                try {
                  const currentUser = Parse.User.current();
                  if (!currentUser) {
                    setIsLoading(false);
                    return;
                  }
                  const userQuery = new Parse.Query(Parse.User);
                  userQuery.notEqualTo('objectId', currentUser.id);
                  userQuery.include('profilePic');
                  userQuery.ascending('name');
                  userQuery.limit(1000);
                  const allUsers = await userQuery.find();
                  const registeredUsers = allUsers.filter(user => user.get('isRegistered') === true);
                  setUsers(registeredUsers);
                  setFilteredUsers(registeredUsers);
                  setError(null);
                } catch (err) {
                  setError(err.message || 'Failed to load users');
                } finally {
                  setIsLoading(false);
                }
              };
              fetchUsers();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? 'No users found' : 'No registered users'}
              </Text>
            </View>
          }
        />
      )}
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
        flex: 1,
    },
    refreshButton: {
        padding: 4,
    },
    searchContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 10,
        backgroundColor: '#f8f8f8',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    clearButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#ff6b6b',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
