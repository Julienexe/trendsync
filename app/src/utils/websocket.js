const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.messageCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  connect(role = 'buyer') {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id;
        const wsUrl = token ? `${WS_URL}?token=${token}&role=${role}&user_id=${userId}` : WS_URL;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.messageCallbacks.forEach(callback => callback(data));
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  generateRoomId(buyerId, sellerId) {
    const ids = [buyerId, sellerId].sort((a, b) => a - b);
    return `chat_${ids[0]}_${ids[1]}`;
  }

  joinRoom(roomId, userId, role = 'buyer') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join_room',
        room_id: roomId,
        user_id: userId,
        role: role,
      }));
    }
  }

  leaveRoom(roomId) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_room',
        room_id: roomId,
      }));
    }
  }

  sendMessage(roomId, content, senderId, senderRole = 'buyer') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        room_id: roomId,
        content: content,
        sender_id: senderId,
        sender_role: senderRole,
      }));
    }
  }

  onMessage(callback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
