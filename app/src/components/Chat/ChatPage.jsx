import { ArrowLeft, MessageSquare, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useChat } from '../../utils/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';

function ChatPage() {
  const navigate = useNavigate();
  const { currentRoom, joinConversation, isConnected, user, generateRoomId } = useChat();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [buyerIdInput, setBuyerIdInput] = useState('');

  const isSeller = user?.is_seller;

  const handleSelectChat = (roomId) => {
    joinConversation(roomId);
  };

  const handleJoinConversation = () => {
    if (buyerIdInput.trim() && user?.id) {
      const roomId = generateRoomId(parseInt(buyerIdInput.trim()), user.id);
      joinConversation(roomId);
      setShowJoinInput(false);
      setBuyerIdInput('');
    }
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
          {isSeller && (
            <div className="p-3 border-b border-gray-200">
              {!showJoinInput ? (
                <button
                  onClick={() => setShowJoinInput(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Start Chat with Buyer
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={buyerIdInput}
                    onChange={(e) => setBuyerIdInput(e.target.value)}
                    placeholder="Enter buyer ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleJoinConversation}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => setShowJoinInput(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
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
