import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Image, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Parse from '../config/parse';

export default function ChatScreen({ route, navigation }) {
  const { chatId, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) {
        console.error('No current user');
        return;
      }

      const Message = Parse.Object.extend('Message');
      const query = new Parse.Query(Message);
      query.equalTo('chat', Parse.Object.createWithoutData('Chat', chatId));
      query.include('sender');
      query.ascending('createdAt');
      const results = await query.find();
      setMessages(results);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };



  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const currentUser = Parse.User.current();
      if (!currentUser) {
        console.error('No current user');
        return;
      }

      // First verify the chat exists
      const Chat = Parse.Object.extend('Chat');
      const chat = await new Parse.Query(Chat).get(chatId);
      if (!chat) {
        console.error('Chat not found');
        return;
      }

      const Message = Parse.Object.extend('Message');
      const message = new Message();
      message.set('text', newMessage);
      message.set('sender', currentUser);
      message.set('chat', chat); // Use the actual chat object instead of pointer
      await message.save();

      // Update last message in chat
      chat.set('lastMessage', message);
      await chat.save();

      setNewMessage('');
      loadMessages(); // Refresh messages after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.get('sender').id === Parse.User.current().id;
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
          {item.get('text')}
        </Text>
        <Text style={[styles.timestamp, isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp]}>
          {item.createdAt.toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#8e8e93" />
          </TouchableOpacity>
          {otherUser && otherUser.profilePicUrl ? (
            <Image style={styles.profileImage} source={{uri: otherUser.profilePicUrl}} />
            ) : (
                <View style={styles.defaultProfile} >
                    <Ionicons name="person" size={24} color="white" />
                </View>
            )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{otherUser ? otherUser.username : 'Chat'}</Text>
            <Text style={styles.lastSeen}>Last seen today 11:00 AM</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.plusButton}>
            <Ionicons name="add" size={24} color="#8e8e93" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          {newMessage.trim() === '' ? (
            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={24} color="#8e8e93" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.voiceButton}>
                <Ionicons name="mic" size={24} color="#8e8e93" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={24} color="#8e8e93" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    height: 60,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  defaultProfile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  lastSeen: {
    fontSize: 12,
    color: '#666',
  },
  callButton: {
    padding: 8,
  },

  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
  },
  ownTimestamp: {
    color: '#e0e0e0',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  plusButton: {
    padding: 8,
    marginRight: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraButton: {
    padding: 8,
    marginRight: 8,
  },
  voiceButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: 'white',
  },
  sendButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
