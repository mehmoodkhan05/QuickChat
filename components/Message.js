import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Parse from '../config/parse';

export default function Message({ message }) {
  const isOwnMessage = message.get('sender').id === Parse.User.current().id;

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      <Text style={[styles.sender, isOwnMessage ? styles.ownSender : styles.otherSender]}>
        {message.get('sender').get('username')}
      </Text>
      <Text style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]}>
        {message.get('text')}
      </Text>
      <Text style={[styles.timestamp, isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp]}>
        {message.createdAt.toLocaleTimeString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ownSender: {
    color: '#e0e0e0',
  },
  otherSender: {
    color: '#666',
  },
  text: {
    fontSize: 16,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
  },
  ownTimestamp: {
    color: '#e0e0e0',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#666',
  },
});
