import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Keyboard } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Video, ResizeMode } from 'expo-av'; 
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import SocketService from '../services/socket';

const UniversalWatchScreen = ({ route }) => {
  const { roomId, initialUrl } = route.params;
  
  // State
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [inputText, setInputText] = useState(initialUrl || ''); // Separate state for input
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isYoutube, setIsYoutube] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false); // Connection Status

  // Refs
  const ytPlayerRef = useRef();
  const expoVideoRef = useRef();
  const isRemoteUpdate = useRef(false);

  // 1. Check Connection Status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setIsConnected(SocketService.socket?.connected || false);
    }, 2000);
    return () => clearInterval(checkConnection);
  }, []);

  // 2. Detect Video Type
  useEffect(() => {
    if (currentUrl) {
      const isYt = currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');
      setIsYoutube(isYt);
      setPlaying(true); 
    }
  }, [currentUrl]);

  // 3. Socket Listener (The "Receiver")
  useEffect(() => {
    SocketService.on('sync-action', async ({ type, payload }) => {
      console.log('📡 Received:', type, payload);
      isRemoteUpdate.current = true; 

      try {
        if (type === 'URL_CHANGE') {
          // Force update url
          setInputText(payload.url); 
          setCurrentUrl(payload.url);
          setPlaying(true);
        } 
        else if (type === 'PLAY') {
          setPlaying(true);
          if (isYoutube) {
            ytPlayerRef.current?.seekTo(payload.time, true);
          } else {
            if (payload.time) await expoVideoRef.current?.setPositionAsync(payload.time * 1000);
            await expoVideoRef.current?.playAsync();
          }
        } 
        else if (type === 'PAUSE') {
          setPlaying(false);
          if (!isYoutube) await expoVideoRef.current?.pauseAsync();
        }
      } catch (e) {
        console.log("Sync Error:", e);
      }

      setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
    });

    return () => SocketService.off('sync-action');
  }, [isYoutube]);

  // 4. User Actions (The "Sender")
  
  const handleLoadVideo = () => {
    if (!inputText) return;
    Keyboard.dismiss();
    setCurrentUrl(inputText);
    // Send to partner
    SocketService.emit('sync-action', { roomId, type: 'URL_CHANGE', payload: { url: inputText } });
  };

  const togglePlay = async () => {
    const newStatus = !playing;
    setPlaying(newStatus);
    
    let currentTime = 0;
    if (isYoutube) {
      try { currentTime = await ytPlayerRef.current?.getCurrentTime(); } catch(e){}
    } else {
      try { 
        const status = await expoVideoRef.current?.getStatusAsync(); 
        currentTime = status.positionMillis / 1000;
      } catch(e){}
    }

    SocketService.emit('sync-action', { 
      roomId, 
      type: newStatus ? 'PLAY' : 'PAUSE', 
      payload: { time: currentTime } 
    });
  };

  const changeVolume = async (val) => {
    setVolume(val);
    if (!isYoutube) {
      await expoVideoRef.current?.setVolumeAsync(val);
    }
  };

  const toggleCall = () => {
    setInCall(!inCall);
    setIsMuted(false);
    if (!inCall) Alert.alert("Voice Channel", "Mic Active (Simulation Only)");
  };

  const getYoutubeId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url?.match(regex);
    return match ? match[1] : null;
  };

  return (
    <View style={styles.container}>
      
      {/* Top Bar with Connection Status */}
      <View style={styles.topBar}>
         <Text style={styles.roomText}>Room: {roomId}</Text>
         <View style={styles.statusBadge}>
            <View style={[styles.dot, { backgroundColor: isConnected ? '#00ff00' : 'red' }]} />
            <Text style={styles.statusText}>{isConnected ? 'Synced' : 'Offline'}</Text>
         </View>
      </View>

      {/* --- VIDEO PLAYER --- */}
      <View style={styles.videoContainer}>
        {currentUrl ? (
          isYoutube ? (
            <YoutubePlayer
              ref={ytPlayerRef}
              height={240}
              play={playing}
              videoId={getYoutubeId(currentUrl)}
            />
          ) : (
            <Video
              key={currentUrl} // 🔥 This forces the player to reload if URL changes
              ref={expoVideoRef}
              style={styles.video}
              source={{ uri: currentUrl }}
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              shouldPlay={playing}
              volume={volume}
              useNativeControls={false} 
            />
          )
        ) : (
          <Text style={styles.placeholderText}>Paste a link below to start watching</Text>
        )}
      </View>

      {/* --- CONTROLS --- */}
      <View style={styles.controls}>
        
        {/* URL Input & Load Button */}
        <View style={styles.inputRow}>
            <TextInput 
              style={styles.urlInput}
              placeholder="Paste Video / YouTube Link" 
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={styles.loadBtn} onPress={handleLoadVideo}>
                <Ionicons name="arrow-forward" size={24} color="white" />
            </TouchableOpacity>
        </View>

        {/* Play/Pause Button */}
        <TouchableOpacity style={styles.mainBtn} onPress={togglePlay}>
          <Ionicons 
            name={playing ? "pause-circle" : "play-circle"} 
            size={80} 
            color="#E50914" 
          />
        </TouchableOpacity>

        {/* Volume Slider */}
        <View style={styles.volumeBox}>
          <Ionicons name="volume-low" size={20} color="#888" />
          <Slider
            style={{ width: 150, height: 40 }}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={changeVolume}
            minimumTrackTintColor="#E50914"
            maximumTrackTintColor="#555"
            thumbTintColor="#fff"
          />
          <Ionicons name="volume-high" size={20} color="#888" />
        </View>
      </View>

      {/* --- CALL UI --- */}
      <View style={styles.callContainer}>
        <TouchableOpacity 
          style={[styles.callBtn, inCall ? styles.callActive : styles.callInactive]} 
          onPress={toggleCall}
        >
          <Ionicons name={inCall ? "call" : "call-outline"} size={20} color="white" />
          <Text style={styles.callText}>
            {inCall ? "Listening..." : "Join Voice"}
          </Text>
        </TouchableOpacity>

        {inCall && (
          <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.muteBtn}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, marginTop: 30 },
  roomText: { color: 'white', fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#aaa', fontSize: 12 },

  videoContainer: { height: 260, backgroundColor: '#111', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
  placeholderText: { color: '#555', textAlign: 'center' },
  
  controls: { padding: 20, alignItems: 'center' },
  inputRow: { flexDirection: 'row', width: '100%', marginBottom: 20, gap: 10 },
  urlInput: { flex: 1, backgroundColor: '#222', color: 'white', padding: 12, borderRadius: 8 },
  loadBtn: { backgroundColor: '#333', padding: 12, borderRadius: 8, justifyContent: 'center' },
  
  mainBtn: { marginBottom: 20 },
  volumeBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },

  callContainer: { 
    position: 'absolute', bottom: 30, alignSelf: 'center', 
    flexDirection: 'row', gap: 10 
  },
  callBtn: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, 
    borderRadius: 30, gap: 8 
  },
  callInactive: { backgroundColor: '#222' },
  callActive: { backgroundColor: '#00aa00' },
  callText: { color: 'white', fontWeight: 'bold' },
  muteBtn: { backgroundColor: '#444', padding: 10, borderRadius: 30 }
});

export default UniversalWatchScreen;