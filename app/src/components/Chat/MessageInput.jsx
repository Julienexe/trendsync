import { useState } from 'react';
import { Send } from 'lucide-react';
import { useChat } from '../../utils/ChatContext';

function MessageInput() {
  const [message, setMessage] = useState('');
  const { sendMessage, currentRoom } = useChat();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && currentRoom) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  if (!currentRoom) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}

export default MessageInput;
