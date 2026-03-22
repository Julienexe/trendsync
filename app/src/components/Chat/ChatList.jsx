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

  // Sort conversations - new ones first
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return 0;
  });

  return (
    <div className="divide-y divide-gray-200">
      {sortedConversations.map((conv) => (
        <button
          key={conv.key}
          onClick={() => onSelectChat(conv.roomId)}
          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
            currentRoom === conv.roomId ? 'bg-blue-50' : ''
          } ${conv.isNew ? 'bg-yellow-50' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${conv.isNew ? 'bg-yellow-500' : 'bg-blue-500'}`}>
              {conv.isNew && <span className="text-xs">NEW</span>}
              {!conv.isNew && 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {conv.isNew ? 'New message!' : `Chat #${conv.otherId || conv.roomId}`}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {conv.isNew ? 'Tap to view' : `Room: ${conv.roomId}`}
              </p>
            </div>
            {conv.isNew && (
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default ChatList;
