import React, { useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import SocketService from '../services/socket';

const WebWatchScreen = ({ route }) => {
  const { roomId } = route.params;
  const webViewRef = useRef(null);

  // 1. Script to Control the Browser (injected into Netflix)
  const INJECTED_CODE = `
    (function() {
      // Listen for socket messages passed from React Native
      document.addEventListener("message", function(event) {
        const data = JSON.parse(event.data);
        const video = document.querySelector('video');
        if (!video) return;

        if (data.type === 'PLAY') {
          video.currentTime = data.payload.time; // Sync time
          video.play();
        } else if (data.type === 'PAUSE') {
          video.pause();
        }
      });

      // Send events FROM Netflix TO React Native
      const video = document.querySelector('video');
      if (video) {
        video.onplay = () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PLAY', time: video.currentTime }));
        };
        video.onpause = () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAUSE' }));
        };
      }
    })();
    true;
  `;

  // 2. Handle Messages from Server
  React.useEffect(() => {
    SocketService.on('sync-action', ({ type, payload }) => {
      // Pass the command into the WebView
      const command = JSON.stringify({ type, payload });
      webViewRef.current?.postMessage(command);
    });
    return () => SocketService.off('sync-action');
  }, []);

  // 3. Handle Messages from WebView (User clicked Play on Netflix)
  const onWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      SocketService.emit('sync-action', { 
        roomId, 
        type: data.type, 
        payload: { time: data.time || 0 } 
      });
    } catch (e) {
      console.log("Non-JSON message from webview");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://www.netflix.com/login' }}
        style={{ flex: 1 }}
        injectedJavaScript={INJECTED_CODE}
        onMessage={onWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }
});

export default WebWatchScreen;