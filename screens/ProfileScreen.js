import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, SafeAreaView, ScrollView, Keyboard } from 'react-native';
import Parse from '../config/parse';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [registerNumber, setRegisterNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalName, setOriginalName] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [originalProfilePicUrl, setOriginalProfilePicUrl] = useState(null);
  const nameInputRef = useRef(null);
  const bioInputRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        await currentUser.fetch({ include: 'profilePic' });
        const userName = currentUser.get('name') || '';
        const userBio = currentUser.get('bio') || '';
        setRegisterNumber(currentUser.get('username') || currentUser.get('phone') || '');
        
        setName(userName);
        setBio(userBio);
        setOriginalName(userName);
        setOriginalBio(userBio);
        
        const profilePicFile = currentUser.get('profilePic');
        if (profilePicFile) {
          try {
            // Check if it's a Parse.File object with url method
            if (profilePicFile.url && typeof profilePicFile.url === 'function') {
              const picUrl = profilePicFile.url();
              setProfilePicUrl(picUrl);
              setOriginalProfilePicUrl(picUrl);
            } else if (profilePicFile._url) {
              // Fallback: try accessing _url property directly
              setProfilePicUrl(profilePicFile._url);
              setOriginalProfilePicUrl(profilePicFile._url);
            } else {
              setOriginalProfilePicUrl(null);
            }
          } catch (error) {
            setOriginalProfilePicUrl(null);
          }
        } else {
          setOriginalProfilePicUrl(null);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    const nameChanged = name.trim() !== originalName.trim();
    const bioChanged = bio.trim() !== originalBio.trim();
    // Check if a new image was selected (profilePic is set) or if the URL changed
    const picChanged = profilePic !== null || (profilePicUrl !== originalProfilePicUrl);
    
    return nameChanged || bioChanged || picChanged;
  };

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
        setProfilePicUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open your photo library.');
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    // Dismiss keyboard and blur inputs
    Keyboard.dismiss();
    nameInputRef.current?.blur();
    bioInputRef.current?.blur();

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
              encoding: 'base64',
            });
            const extension = profilePic.split('.').pop() || 'jpg';
            const file = new Parse.File(`profile_${Date.now()}.${extension}`, { base64 });
            await file.save();
            currentUser.set('profilePic', file);
          } catch (fileError) {
            Alert.alert('Image upload failed', 'We could not upload your image. Other changes were saved.');
          }
        }
        
        // Always set ACL to allow authenticated users to read (fixes existing users too)
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true); // Allow authenticated users to read
        acl.setWriteAccess(currentUser, true); // Only owner can write
        currentUser.setACL(acl);
        
        await currentUser.save();
        
        // Update the profile picture URL if a new image was uploaded
        if (profilePic) {
          const updatedProfilePic = currentUser.get('profilePic');
          if (updatedProfilePic) {
            try {
              if (updatedProfilePic.url && typeof updatedProfilePic.url === 'function') {
                const newPicUrl = updatedProfilePic.url();
                setProfilePicUrl(newPicUrl);
                setOriginalProfilePicUrl(newPicUrl);
              } else if (updatedProfilePic._url) {
                setProfilePicUrl(updatedProfilePic._url);
                setOriginalProfilePicUrl(updatedProfilePic._url);
              }
            } catch (error) {
              // Error getting updated profile pic URL
            }
          }
        }
        
        // Clear the local profilePic state since it's now saved
        setProfilePic(null);
        
        // Update original values to reflect saved state
        setOriginalName(name.trim());
        setOriginalBio(bio.trim());
        
        Alert.alert('Success', 'Changes saved!');
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <TouchableOpacity 
          style={[styles.saveButton, (isSaving || !hasChanges()) && styles.saveButtonDisabled]} 
          onPress={saveProfile} 
          disabled={isSaving || !hasChanges()}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges() && styles.saveButtonTextDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.profilePicContainer} onPress={chooseImage}>
          {profilePicUrl ? (
            <Image source={{ uri: profilePicUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.defaultProfile}>
              <Ionicons name="person" size={50} color="#ccc" />
            </View>
          )}
          <View style={styles.editIconContainer}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.registerNumberContainer}>
          <Text style={styles.registerNumberLabel}>Register Number</Text>
          <Text style={styles.registerNumberText}>{registerNumber}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            ref={nameInputRef}
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            ref={bioInputRef}
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 25,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  defaultProfile: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  registerNumberContainer: {
    width: '100%',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  registerNumberLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  registerNumberText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    color: '#000',
    fontSize: 16,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

