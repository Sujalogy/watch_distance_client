// frontend/src/screens/WatchScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import SocketService from '../services/socket';

const WatchScreen = ({ route }) => {
  const { roomId } = route.params; // Passed from Home Screen
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef();
  
  // LOCK: Prevents infinite loops. 
  // If true, we are reacting to a socket event, not user input.
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    const socket = SocketService.socket;

    // LISTEN for commands from partner
    socket.on('sync-action', ({ type, payload }) => {
      console.log('Received command:', type, payload);
      isRemoteUpdate.current = true; // Engage Lock

      switch (type) {
        case 'PLAY':
          setPlaying(true);
          break;
        case 'PAUSE':
          setPlaying(false);
          break;
        case 'SEEK':
          playerRef.current?.seekTo(payload.time, true);
          break;
      }

      // Disengage lock after a small delay (hacky but effective for MVP)
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    });

    return () => {
      socket.off('sync-action');
    };
  }, []);

  // EMIT events when YOU touch the controls
  const onStateChange = (state) => {
    if (isRemoteUpdate.current) return; // Ignore if triggered by partner

    if (state === 'playing') {
      SocketService.socket.emit('sync-action', { roomId, type: 'PLAY' });
    } else if (state === 'paused') {
      SocketService.socket.emit('sync-action', { roomId, type: 'PAUSE' });
    }
  };

  // YouTube doesn't have a direct "onSeek" event, so we rely on state changes
  // or a manual "Sync" button for seeking in this basic version.

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Connected to Room: {roomId}</Text>
      
      <YoutubePlayer
        ref={playerRef}
        height={300}
        play={playing}
        videoId={"dQw4w9WgXcQ"} // Default video
        onChangeState={onStateChange}
      />

      <View style={styles.controls}>
        <Text style={styles.status}>
           {playing ? "Playing Together ❤️" : "Paused"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  header: { color: 'white', textAlign: 'center', marginBottom: 20 },
  status: { color: 'white', textAlign: 'center', marginTop: 20 }
});

export default WatchScreen;