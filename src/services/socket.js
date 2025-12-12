import io from 'socket.io-client';

// ⚠️ REPLACE THIS with your PC's IP address (Run 'ipconfig' or 'ifconfig')
const SOCKET_URL = 'http://192.168.1.5:3000';

class SocketService {
  socket = null;

  connect() {
    if (this.socket?.connected) return; // Prevent double connections
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'], // Forces WebSocket only (faster)
    });

    this.socket.on('connect', () => console.log('✅ Connected to Server'));
    this.socket.on('connect_error', (err) => console.log('⚠️ Connection Error:', err));
  }

  joinRoom(roomId) {
    if (!this.socket) this.connect();
    this.socket.emit('join-room', roomId);
  }

  leaveRoom(roomId) {
    if (this.socket) this.socket.emit('leave-room', roomId);
  }

  emit(event, data) {
    if (this.socket) this.socket.emit(event, data);
  }

  on(event, cb) {
    if (this.socket) this.socket.on(event, cb);
  }

  off(event) {
    if (this.socket) this.socket.off(event);
  }
}

export default new SocketService();