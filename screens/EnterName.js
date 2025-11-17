import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import Parse from '../config/parse';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function EnterName({ navigation }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const chooseImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Allow photo library access to upload a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfilePic(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not open your photo library.');
    }
  };

  const handleBackToStepOne = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your full name to continue.');
      return;
    }

    try {
      setIsSaving(true);
      const currentUser = Parse.User.current();
      if (currentUser) {
        currentUser.set('name', name.trim());
        if (bio.trim()) {
          currentUser.set('bio', bio.trim());
        } else {
          currentUser.unset('bio');
        }
        if (profilePic) {
            try {
              const base64 = await FileSystem.readAsStringAsync(profilePic, {
                encoding: FileSystem.EncodingType.Base64,
              });
              const extension = profilePic.split('.').pop() || 'jpg';
              const file = new Parse.File(`profile_${Date.now()}.${extension}`, { base64 });
              await file.save();
              currentUser.set('profilePic', file);
            } catch (fileError) {
              console.error('Profile image upload error:', fileError);
              Alert.alert('Image upload failed', 'We could not upload your image. You can continue without a photo.');
            }
        }
        currentUser.set('isRegistered', true);
        await currentUser.save();
        navigation.replace('ChatList');
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={['#141e30', '#243b55']}
      style={styles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToStepOne}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Add Profile Details</Text>
      <Text style={styles.subtitle}>
        Upload a profile image, enter your full name, then add a short bio.
      </Text>
      
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
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="rgba(255,255,255,0.7)"
      />
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Bio (optional)"
        value={bio}
        onChangeText={setBio}
        multiline
        placeholderTextColor="rgba(255,255,255,0.7)"
      />
      <TouchableOpacity style={[styles.button, isSaving && styles.buttonDisabled]} onPress={saveProfile} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Finish</Text>}
      </TouchableOpacity>
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#4da1ff',
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  defaultProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addPhotoText: {
    marginTop: 5,
    color: '#ccc',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
  },
  button: {
    backgroundColor: '#4da1ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
