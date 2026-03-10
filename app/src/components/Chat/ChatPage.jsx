import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../utils/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';

function ChatPage() {
  const navigate = useNavigate();
  const { currentRoom, joinConversation, isConnected } = useChat();

  const handleSelectChat = (roomId) => {
    joinConversation(roomId);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Messages</h1>
        <div className={`ml-auto w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${currentRoom ? 'hidden md:block md:w-80' : 'w-full'} border-r border-gray-200 overflow-y-auto`}>
          <ChatList onSelectChat={handleSelectChat} />
        </div>

        <div className="flex-1 flex flex-col">
          <ChatWindow />
          <MessageInput />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
