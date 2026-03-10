import { useChat } from '../../utils/ChatContext';

function ChatList({ onSelectChat }) {
  const { conversations, currentRoom } = useChat();

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No conversations yet.</p>
        <p className="text-sm mt-1">Start a chat from a product page.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conv) => (
        <button
          key={conv.key}
          onClick={() => onSelectChat(conv.roomId)}
          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
            currentRoom === conv.roomId ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              S
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                Seller #{conv.sellerId}
              </p>
              <p className="text-sm text-gray-500 truncate">
                Product #{conv.productId}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default ChatList;
