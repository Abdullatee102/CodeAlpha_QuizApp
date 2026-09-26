// app/services/socket.js
import { io } from 'socket.io-client';
import { storage } from '../utils/mmkvStorage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  getServerUrl() {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.132.15:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
  }

  connect() {
    const token = storage.getString('userToken');
    if (!token) {
      console.log('[SOCKET] No auth token found in storage, skipping connection');
      return null;
    }

    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Clean up any stale disconnected instance
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const serverUrl = this.getServerUrl();
    console.log(`[SOCKET] Connecting to ${serverUrl}...`);

    this.socket = io(serverUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`[SOCKET] Connected successfully with ID: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`[SOCKET] Disconnected. Reason: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      console.warn(`[SOCKET] Connection error: ${error.message}`);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('[SOCKET] Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    if (!this.socket || !this.isConnected) {
      return this.connect();
    }
    return this.socket;
  }

  // Room subscriptions
  joinConversation(conversationId) {
    if (!conversationId) return;
    const socket = this.getSocket();
    if (socket) {
      console.log(`[SOCKET] Emitting join:conversation -> ${conversationId}`);
      socket.emit('join:conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (!conversationId) return;
    const socket = this.getSocket();
    if (socket) {
      socket.emit('leave:room', `conversation:${conversationId}`);
    }
  }

  joinSupport(requestId) {
    if (!requestId) return;
    const socket = this.getSocket();
    if (socket) {
      console.log(`[SOCKET] Emitting join:support -> ${requestId}`);
      socket.emit('join:support', requestId);
    }
  }

  leaveSupport(requestId) {
    if (!requestId) return;
    const socket = this.getSocket();
    if (socket) {
      socket.emit('leave:room', `support:${requestId}`);
    }
  }

  joinFaculty(facultyId) {
    if (!facultyId) return;
    const socket = this.getSocket();
    if (socket) {
      socket.emit('join:faculty', facultyId);
    }
  }

  joinDepartment(departmentId) {
    if (!departmentId) return;
    const socket = this.getSocket();
    if (socket) {
      socket.emit('join:department', departmentId);
    }
  }

  joinLevel(level, departmentId) {
    if (!level) return;
    const socket = this.getSocket();
    if (socket) {
      socket.emit('join:level', { level, departmentId });
    }
  }

  sendMessage(conversationId, text) {
    const socket = this.getSocket();
    if (socket && this.isConnected) {
      socket.emit('send_message', { conversationId, text });
      return true;
    }
    return false;
  }

  on(event, callback) {
    const socket = this.getSocket();
    if (socket) {
      socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
