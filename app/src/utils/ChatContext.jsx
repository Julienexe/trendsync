import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import websocketService from './websocket';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const role = user?.is_seller ? 'seller' : 'buyer';
        await websocketService.connect(role);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    if (user) {
      initWebSocket();
    }

    unsubscribeRef.current = websocketService.onMessage((data) => {
      // Handle incoming chat messages
      if (data.type === 'chat_message' && data.room_id === currentRoom) {
        if (data.sender_id === user?.id) {
          return;
        }
        setMessages(prev => ({
          ...prev,
          [data.room_id]: [...(prev[data.room_id] || []), {
            content: data.content,
            sender_id: data.sender_id,
            timestamp: new Date().toISOString(),
          }]
        }));
      }
      
      // Handle new chat notification for sellers
      if (data.type === 'new_chat_notification') {
        const roomId = data.room_id;
        
        // Add to conversations if not already there
        setConversations(prev => {
          const exists = prev.some(c => c.roomId === roomId);
          if (!exists) {
            // Extract IDs from room_id (format: chat_min_max)
            try {
              const parts = roomId.replace("chat_", "").split("_");
              const otherId = parseInt(parts[0]) === user?.id ? parseInt(parts[1]) : parseInt(parts[0]);
              return [...prev, {
                key: roomId,
                roomId,
                otherId,
                isNew: true,
              }];
            } catch (e) {
              return prev;
            }
          }
          // Mark existing conversation as new/unread
          return prev.map(c => c.roomId === roomId ? { ...c, isNew: true } : c);
        });
        
        // Also add to unread notifications
        setUnreadNotifications(prev => {
          const exists = prev.some(n => n.room_id === roomId);
          if (!exists) {
            return [...prev, {
              room_id: roomId,
              content: data.content,
              sender_id: data.sender_id,
              timestamp: new Date().toISOString(),
            }];
          }
          return prev;
        });
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, currentRoom]);

  const generateRoomId = useCallback((sellerId) => {
    if (!user?.id) return null;
    return websocketService.generateRoomId(user.id, sellerId);
  }, [user]);

  const startChat = useCallback(async (sellerId) => {
    if (!user?.id) {
      console.error('User not logged in');
      return null;
    }

    const roomId = generateRoomId(sellerId);
    if (!roomId) return null;

    const role = user?.is_seller ? 'seller' : 'buyer';
    websocketService.joinRoom(roomId, user.id, role);

    setConversations(prev => {
      const exists = prev.some(c => c.roomId === roomId);
      if (!exists) {
        return [...prev, {
          key: roomId,
          roomId,
          otherId: sellerId,
        }];
      }
      return prev;
    });

    setCurrentRoom(roomId);
    return roomId;
  }, [user, generateRoomId]);

  const joinConversation = useCallback((roomId) => {
    if (!user?.id) return;
    const role = user?.is_seller ? 'seller' : 'buyer';
    websocketService.joinRoom(roomId, user.id, role);
    
    // Mark as read when joining
    setConversations(prev => prev.map(c => c.roomId === roomId ? { ...c, isNew: false } : c));
    setUnreadNotifications(prev => prev.filter(n => n.room_id !== roomId));
    
    setCurrentRoom(roomId);
  }, [user]);

  const leaveChat = useCallback(() => {
    if (currentRoom) {
      websocketService.leaveRoom(currentRoom);
      setCurrentRoom(null);
    }
  }, [currentRoom]);

  const sendMessage = useCallback((content) => {
    if (!currentRoom || !user?.id) return;
    
    const message = {
      content,
      sender_id: user.id,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [currentRoom]: [...(prev[currentRoom] || []), message]
    }));

    const role = user?.is_seller ? 'seller' : 'buyer';
    websocketService.sendMessage(currentRoom, content, user.id, role);
  }, [currentRoom, user]);

  const getMessages = useCallback((roomId) => {
    return messages[roomId] || [];
  }, [messages]);

  const clearUnreadNotification = useCallback((roomId) => {
    setUnreadNotifications(prev => prev.filter(n => n.room_id !== roomId));
    setConversations(prev => prev.map(c => c.roomId === roomId ? { ...c, isNew: false } : c));
  }, []);

  const value = {
    isConnected,
    conversations,
    currentRoom,
    messages: messages[currentRoom] || [],
    unreadNotifications,
    user,
    startChat,
    joinConversation,
    leaveChat,
    sendMessage,
    getMessages,
    generateRoomId,
    clearUnreadNotification,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
