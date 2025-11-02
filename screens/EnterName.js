import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import Parse from '../config/parse';
import { Ionicons } from '@expo/vector-icons';

export default function EnterName({ navigation }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  const chooseImage = () => {
    // Since there is no file picker API, we will use a placeholder.
    const placeholderImageUrl = 'https://via.placeholder.com/150';
    setProfilePic(placeholderImageUrl);
  };

  const saveName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        currentUser.set('name', name);
        currentUser.set('bio', bio);
        if (profilePic) {
          currentUser.set('profilePic', new Parse.File('profile.jpg', { uri: profilePic }));
        }
        await currentUser.save();
        navigation.replace('ChatList');
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>
      
      <TouchableOpacity style={styles.profilePicContainer} onPress={chooseImage}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultProfile}>
            <Ionicons name="camera" size={40} color="#ccc" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={saveName}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  defaultProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    marginTop: 5,
    color: '#888',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
