import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const dummyCalls = [
  {
    id: '1',
    name: 'John Doe',
    time: 'Yesterday, 10:30 PM',
    type: 'incoming',
    missed: false,
  },
  {
    id: '2',
    name: 'Jane Smith',
    time: 'Yesterday, 9:15 PM',
    type: 'outgoing',
    missed: false,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    time: 'Today, 11:00 AM',
    type: 'incoming',
    missed: true,
  },
];

export default function CallsScreen({ navigation }) {
  const renderCall = ({ item }) => (
    <View style={styles.callItem}>
      <View style={styles.callInfo}>
        <Text style={[styles.callName, item.missed && styles.missedCall]}>{item.name}</Text>
        <View style={styles.callMeta}>
          <Ionicons
            name={item.type === 'incoming' ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={16}
            color={item.missed ? 'red' : '#666'}
          />
          <Text style={styles.callTime}>{item.time}</Text>
        </View>
      </View>
      <TouchableOpacity>
        <Ionicons name="call" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
      </View>
      <FlatList
        data={dummyCalls}
        renderItem={renderCall}
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
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  callItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  missedCall: {
    color: 'red',
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  callTime: {
    marginLeft: 5,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 80,
  },
});
