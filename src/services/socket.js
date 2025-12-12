// frontend/src/services/socket.js
import io from 'socket.io-client';

// REPLACE with your computer's local IP (e.g., 192.168.1.X) for testing
// Android Emulator cannot see 'localhost'
const SOCKET_URL = 'http://192.168.1.5:3000'; 

class SocketService {
  socket = null;

  connect() {
    this.socket = io(SOCKET_URL);
  }

  joinRoom(roomId) {
    if (this.socket) this.socket.emit('join-room', roomId);
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
}

export default new SocketService();