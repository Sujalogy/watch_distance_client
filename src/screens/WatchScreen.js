import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import SocketService from '../services/socket';

const WatchScreen = ({ route }) => {
  const { roomId } = route.params;
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef();
  
  // LOCK: Prevents infinite loops (Me -> Server -> Her -> Server -> Me)
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    SocketService.on('sync-action', async ({ type, payload }) => {
      console.log('Received:', type, payload);
      isRemoteUpdate.current = true; 

      if (type === 'PLAY') {
        // 1. Sync Time First
        playerRef.current?.seekTo(payload.time, true);
        // 2. Then Play
        setPlaying(true);
      } else if (type === 'PAUSE') {
        setPlaying(false);
      }

      // Unlock after 1 second
      setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
    });

    return () => SocketService.off('sync-action');
  }, []);

  const onStateChange = useCallback(async (state) => {
    if (isRemoteUpdate.current) return;

    if (state === 'playing') {
      const time = await playerRef.current?.getCurrentTime();
      SocketService.emit('sync-action', { 
        roomId, 
        type: 'PLAY', 
        payload: { time } // Send time with play to handle seeking!
      });
    } else if (state === 'paused') {
      SocketService.emit('sync-action', { roomId, type: 'PAUSE', payload: {} });
    }
  }, [roomId]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Room: {roomId}</Text>
      <YoutubePlayer
        ref={playerRef}
        height={240}
        play={playing}
        videoId={"dQw4w9WgXcQ"}
        onChangeState={onStateChange}
      />
      <Text style={styles.status}>{playing ? "▶ Playing" : "⏸ Paused"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  header: { color: '#aaa', textAlign: 'center', marginBottom: 20 },
  status: { color: 'white', textAlign: 'center', marginTop: 20, fontSize: 18 }
});

export default WatchScreen;