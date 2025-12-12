import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import SocketService from '../services/socket';

const HomeScreen = ({ navigation }) => {
  const [roomId, setRoomId] = useState('couple-room-1'); 
  const [videoUrl, setVideoUrl] = useState(''); // Unified URL input

  useEffect(() => {
    SocketService.connect();
  }, []);

  const enterRoom = () => {
    if (!roomId) {
      Alert.alert("Missing Info", "Please enter a Room ID");
      return;
    }
    // If no URL is provided, we assume they are joining an existing room
    SocketService.joinRoom(roomId);
    
    navigation.navigate('UniversalWatchScreen', { 
      roomId, 
      initialUrl: videoUrl || null // Pass the URL if the user added one
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watch Together 🍿</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter Room ID (e.g. love-nest)"
        placeholderTextColor="#888"
        value={roomId}
        onChangeText={setRoomId}
      />

      <TextInput
        style={styles.input}
        placeholder="Paste Video Link (YouTube, MP4, Telegram Direct Link)"
        placeholderTextColor="#888"
        value={videoUrl}
        onChangeText={setVideoUrl}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.btn} onPress={enterRoom}>
        <Text style={styles.btnText}>Join Room & Watch</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        * For Telegram: Use a direct download link (ending in .mp4)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, color: 'white', fontWeight: 'bold', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#222', color: 'white', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
  btn: { width: '100%', backgroundColor: '#E50914', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  hint: { color: '#666', marginTop: 20, fontSize: 12, textAlign: 'center' }
});

export default HomeScreen;