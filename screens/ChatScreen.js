import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Image, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Parse from '../config/parse';

export default function ChatScreen({ route, navigation }) {
  const { chatId, otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef();

  const loadMessages = async () => {
    try {
      const currentUser = Parse.User.current();
      if (!currentUser) {
        return null;
      }

      const Message = Parse.Object.extend('Message');
      const query = new Parse.Query(Message);
      query.equalTo('chat', Parse.Object.createWithoutData('Chat', chatId));
      query.include('sender');
      query.ascending('createdAt');
      
      const results = await query.find();
      console.log(`Loaded ${results.length} messages`);
      
      // Ensure all messages have sender included
      const messagesWithSender = await Promise.all(
        results.map(async (msg) => {
          try {
            const sender = msg.get('sender');
            if (!sender) {
              await msg.fetch({ include: 'sender' });
            }
          } catch (err) {
            // If fetch fails, continue with message anyway
          }
          return msg;
        })
      );
      setMessages(messagesWithSender);

      // Parse LiveQuery subscriptions may not work on web, so we'll use polling as fallback
      let subscription = null;
      if (Platform.OS !== 'web') {
        try {
          subscription = await query.subscribe();
          subscription.on('create', (message) => {
            // Fetch the message with sender included
            message.fetch({ include: 'sender' }).then(() => {
              setMessages(prevMessages => {
                // Check if message already exists to avoid duplicates
                const exists = prevMessages.some(m => m.id === message.id);
                if (exists) return prevMessages;
                return [...prevMessages, message];
              });
            });
          });
        } catch (subError) {
          // Subscription failed, will use polling instead
          subscription = null;
        }
      }

      return subscription;

    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let activeSubscription = null;
    let pollingInterval = null;

    const initialiseMessages = async () => {
      try {
        const subscription = await loadMessages();
        if (!isMounted) {
          subscription?.unsubscribe();
          return;
        }
        activeSubscription = subscription;

        // On web, use polling to check for new messages since LiveQuery may not work
        if (Platform.OS === 'web' && !subscription) {
          pollingInterval = setInterval(async () => {
            if (!isMounted) return;
            try {
              const currentUser = Parse.User.current();
              if (!currentUser) return;

              const Message = Parse.Object.extend('Message');
              const query = new Parse.Query(Message);
              query.equalTo('chat', Parse.Object.createWithoutData('Chat', chatId));
              query.include('sender');
              query.ascending('createdAt');
              
              const results = await query.find();
              setMessages(prevMessages => {
                // Only update if we have new messages
                if (results.length !== prevMessages.length) {
                  return results;
                }
                // Check if any message IDs changed
                const hasChanges = results.some((msg, idx) => {
                  const prevMsg = prevMessages[idx];
                  return !prevMsg || msg.id !== prevMsg.id;
                });
                return hasChanges ? results : prevMessages;
              });
            } catch (error) {
              // Error polling messages
            }
          }, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        // Error initialising message subscription
      }
    };

    initialiseMessages();

    return () => {
      isMounted = false;
      if (activeSubscription) {
        activeSubscription.unsubscribe();
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const currentUser = Parse.User.current();
      if (!currentUser) {
        return;
      }

      // First verify the chat exists
      const Chat = Parse.Object.extend('Chat');
      const chat = await new Parse.Query(Chat).get(chatId);
      if (!chat) {
        return;
      }

      const Message = Parse.Object.extend('Message');
      const message = new Message();
      message.set('text', newMessage);
      message.set('sender', currentUser);
      message.set('chat', chat); // Use the actual chat object instead of pointer
      await message.save();
      
      // Include sender in the saved message
      await message.fetch({ include: 'sender' });

      // Update last message in chat
      chat.set('lastMessage', message);
      await chat.save();

      // Add message to local state immediately
      setMessages(prevMessages => {
        // Check if message already exists to avoid duplicates
        const exists = prevMessages.some(m => m.id === message.id);
        if (exists) return prevMessages;
        console.log(`Adding message to state. Total messages: ${prevMessages.length + 1}`);
        return [...prevMessages, message];
      });
      
      // Scroll to bottom after a short delay to ensure message is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      setNewMessage('');
    } catch (error) {
      // Error sending message
    }
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDateStr = messageDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (messageDateStr === todayStr) {
      return 'Today';
    } else if (messageDateStr === yesterdayStr) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const shouldShowDateHeader = (currentItem, previousItem) => {
    if (!previousItem) return true;
    const currentDate = new Date(currentItem.createdAt).toDateString();
    const previousDate = new Date(previousItem.createdAt).toDateString();
    return currentDate !== previousDate;
  };

  const renderMessage = ({ item, index }) => {
    if (!item) return null;
    
    try {
      const sender = item.get('sender');
      const currentUser = Parse.User.current();
      const isOwnMessage = sender && currentUser && (sender.id === currentUser.id || sender.objectId === currentUser.id);
      const previousMessage = index > 0 && messages[index - 1] ? messages[index - 1] : null;
      const showDateHeader = shouldShowDateHeader(item, previousMessage);
      const messageText = item.get('text') || '';
      const messageDate = item.createdAt || item.get('createdAt') || new Date();

      if (!messageText) return null;

      return (
        <View>
          {showDateHeader && (
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{formatDate(messageDate)}</Text>
            </View>
          )}
          <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
            <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
              {messageText}
            </Text>
            <Text style={[styles.timestamp, isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp]}>
              {formatTime(messageDate)}
            </Text>
          </View>
        </View>
      );
    } catch (error) {
      return null;
    }
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
            <Text style={styles.headerTitle}>{otherUser ? otherUser.name || otherUser.username : 'Chat'}</Text>
            <Text style={styles.lastSeen}>Last seen today 11:00 AM</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        enabled={Platform.OS !== 'web'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.id || `message-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
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
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    height: 60,
    marginTop: Platform.OS === 'web' ? 0 : 40,
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
  },
  messagesListContent: {
    padding: 10,
    flexGrow: 1,
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
    textAlign: 'left',
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 15,
    marginHorizontal: 10,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : Platform.OS === 'web' ? 10 : 50,
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
