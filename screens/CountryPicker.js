import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const countries = [
  { name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { name: 'Pakistan', dial_code: '+92', flag: '🇵🇰' },
  { name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
];

export default function CountryPicker({ isVisible, onClose, onSelect }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <FlatList
            data={countries}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.countryItem} onPress={() => onSelect(item)}>
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.dialCode}>{item.dial_code}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  flag: {
    fontSize: 20,
    marginRight: 15,
  },
  countryName: {
    fontSize: 16,
    flex: 1,
  },
  dialCode: {
    fontSize: 16,
    color: '#888',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
