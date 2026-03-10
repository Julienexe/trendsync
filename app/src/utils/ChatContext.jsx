import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import websocketService from './websocket';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [user, setUser] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const initWebSocket = async () => {
      try {
        await websocketService.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    initWebSocket();

    unsubscribeRef.current = websocketService.onMessage((data) => {
      if (data.type === 'chat_message' && data.room_id === currentRoom) {
        setMessages(prev => ({
          ...prev,
          [data.room_id]: [...(prev[data.room_id] || []), {
            content: data.content,
            sender_id: data.sender_id,
            timestamp: new Date().toISOString(),
          }]
        }));
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentRoom]);

  const generateRoomId = useCallback((sellerId, productId) => {
    if (!user?.id) return null;
    return websocketService.generateRoomId(user.id, sellerId, productId);
  }, [user]);

  const startChat = useCallback(async (sellerId, productId) => {
    if (!user?.id) {
      console.error('User not logged in');
      return null;
    }

    const roomId = generateRoomId(sellerId, productId);
    if (!roomId) return null;

    websocketService.joinRoom(roomId, user.id);

    const conversationKey = `${sellerId}_${productId}`;
    
    setConversations(prev => {
      const exists = prev.some(c => c.key === conversationKey);
      if (!exists) {
        return [...prev, {
          key: conversationKey,
          roomId,
          sellerId,
          productId,
        }];
      }
      return prev;
    });

    setCurrentRoom(roomId);
    return roomId;
  }, [user, generateRoomId]);

  const joinConversation = useCallback((roomId) => {
    if (!user?.id) return;
    websocketService.joinRoom(roomId, user.id);
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

    websocketService.sendMessage(currentRoom, content, user.id);
  }, [currentRoom, user]);

  const getMessages = useCallback((roomId) => {
    return messages[roomId] || [];
  }, [messages]);

  const value = {
    isConnected,
    conversations,
    currentRoom,
    messages: messages[currentRoom] || [],
    user,
    startChat,
    joinConversation,
    leaveChat,
    sendMessage,
    getMessages,
    generateRoomId,
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
