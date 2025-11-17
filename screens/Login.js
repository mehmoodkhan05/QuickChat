import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Parse from '../config/parse';
import { saveSession } from '../utils/session';

const countries = [
  { name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { name: 'Pakistan', dial_code: '+92', flag: '🇵🇰' },
  { name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
];

export default function Login({ navigation }) {
  const [country, setCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const sendOtp = async () => {
    if (!phoneNumber) {
        Alert.alert('Error', 'Please enter a phone number');
        return;
    }
    const fullPhoneNumber = `${country.dial_code}${phoneNumber}`;
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`OTP for ${fullPhoneNumber}: ${generatedOtp}`);
    Alert.alert('OTP Sent', `OTP for ${fullPhoneNumber}: ${generatedOtp}`);
    setOtpSent(true);
  };

  const verifyOtp = async () => {
    if (!otp) {
        Alert.alert('Error', 'Please enter the OTP');
        return;
    }
    if (otp.length === 4) {
        try {
            const username = `${country.dial_code}${phoneNumber}`;
            const password = 'dummyPassword';
            let isNewUser = false;
            try {
                const loggedInUser = await Parse.User.logIn(username, password);
                await saveSession({ username, password });
                const isRegisteredUser = loggedInUser.get('isRegistered');
                if (isRegisteredUser) {
                    navigation.replace('ChatList');
                } else {
                    navigation.replace('EnterName');
                }
            } catch (error) {
                if (error.code === 101) { 
                    const user = new Parse.User();
                    user.set('username', username);
                    user.set('password', password);
                    user.set('phone', `${country.dial_code}${phoneNumber}`);
                    user.set('isRegistered', false);
                    await user.signUp();
                    await saveSession({ username, password });
                    isNewUser = true;
                } else {
                    throw error;
                }
            }
            if (isNewUser) {
                navigation.replace('EnterName');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    } else {
        Alert.alert('Error', 'Invalid OTP');
    }
  };

  return (
    <LinearGradient
      colors={['#0f2027', '#203a43', '#2c5364']}
      style={styles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.overlay}>
    <View style={styles.card}>
      <Text style={styles.title}>Verify Your Phone Number</Text>
      {!otpSent ? (
          <>
            <View style={styles.phoneInputContainer}>
                <TouchableOpacity style={styles.countryButton} onPress={() => setDropdownVisible(true)}>
                    <Text style={styles.flag}>{country.flag}</Text>
                    <Text style={styles.countryCodeText}>{country.dial_code}</Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                />
            </View>
            <Modal
                transparent={true}
                visible={dropdownVisible}
                onRequestClose={() => setDropdownVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
                    <View style={styles.dropdown}>
                        <FlatList
                            data={countries}
                            keyExtractor={(item) => item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.countryItem} onPress={() => {
                                    setCountry(item);
                                    setDropdownVisible(false);
                                }}>
                                    <Text style={styles.flag}>{item.flag}</Text>
                                    <Text style={styles.countryName}>{item.name}</Text>
                                    <Text style={styles.dialCode}>{item.dial_code}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
            <TouchableOpacity style={styles.button} onPress={sendOtp}>
                <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
          </>
      ) : (
        <>
            <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholderTextColor="rgba(255,255,255,0.7)"
            />
            <TouchableOpacity style={styles.button} onPress={verifyOtp}>
                <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
        </>
      )}
    </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
  },
  phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
  },
  countryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      padding: 15,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.15)',
      marginRight: 10,
  },
  flag: {
      fontSize: 20,
      marginRight: 5,
  },
  countryCodeText: {
    color: '#fff',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
  },
  modalOverlay: {
      flex: 1,
  },
  dropdown: {
      position: 'absolute',
      top: 250, 
      left: 20,
      right: 20,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      backgroundColor: '#fff',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryName: {
    fontSize: 16,
    flex: 1,
  },
  dialCode: {
    fontSize: 16,
    color: '#888',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
