import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import SocketService from '../services/socket';

const HomeScreen = ({ navigation }) => {
  const [roomId, setRoomId] = useState('couple-love-123'); 

  useEffect(() => {
    SocketService.connect();
  }, []);

  const enterRoom = (screen) => {
    if (!roomId) {
      Alert.alert("Wait!", "Please enter a Room ID");
      return;
    }
    SocketService.joinRoom(roomId);
    navigation.navigate(screen, { roomId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watch Together ❤️</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter Room Code"
        placeholderTextColor="#888"
        value={roomId}
        onChangeText={setRoomId}
      />

      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: '#FF0000' }]}
        onPress={() => enterRoom('WatchScreen')}
      >
        <Text style={styles.btnText}>Watch YouTube</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: '#E50914' }]} 
        onPress={() => enterRoom('WebWatchScreen')}
      >
        <Text style={styles.btnText}>Watch Netflix / Web</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, color: 'white', fontWeight: 'bold', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#222', color: 'white', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
  btn: { width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default HomeScreen;