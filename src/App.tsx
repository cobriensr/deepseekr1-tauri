import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Define message types
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Separate interface for displayed messages
interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

interface ApiResponse {
  choices: Array<{
    message: ChatMessage;
  }>;
}

function App() {
  // Separate state for system message and conversation messages
  const [systemMessage, setSystemMessage] = useState<string>(
    "You are an award winning author and video game narrative designer"
  );
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingSystem, setIsEditingSystem] = useState(false);

  // Function to prepare messages for API request by combining system message with conversation
  const prepareApiMessages = (conversationMessages: DisplayMessage[]): ChatMessage[] => {
    return [
      { role: "system", content: systemMessage },
      ...conversationMessages
    ];
  };

  async function handleChatSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setIsLoading(true);

    // Add new user message to conversation
    const newDisplayMessages: DisplayMessage[] = [
      ...messages,
      { role: "user", content: inputMessage.trim() }
    ];
    setMessages(newDisplayMessages);
    setInputMessage("");

    try {
      // Prepare full message history including system message for API request
      const apiMessages = prepareApiMessages(newDisplayMessages);
      
      const response = await invoke<string>("send_deepseek_message", {
        request: {
          messages: apiMessages,
          temperature: 1.0
        }
      });

      const responseData = JSON.parse(response) as ApiResponse;
      const assistantMessage = responseData.choices[0].message;

      // Only add assistant message to displayed messages
      setMessages(prevMessages => [...prevMessages, {
        role: "assistant",
        content: assistantMessage.content
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Function to handle system message updates
  const handleSystemMessageUpdate = (newMessage: string) => {
    setSystemMessage(newMessage);
    setIsEditingSystem(false);
  };

  return (
    <main className="flex flex-col h-screen p-4 bg-gray-50">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Deepseek Chat Interface</h1>
        <p className="text-gray-600">Ask questions or request assistance below</p>
      </header>

      {/* System Message Section */}
      <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-700">System Message</h2>
          <button
            onClick={() => setIsEditingSystem(!isEditingSystem)}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {isEditingSystem ? 'Save' : 'Edit'}
          </button>
        </div>
        {isEditingSystem ? (
          <textarea
            value={systemMessage}
            onChange={(e) => setSystemMessage(e.target.value)}
            onBlur={(e) => handleSystemMessageUpdate(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        ) : (
          <p className="text-sm text-gray-600">{systemMessage}</p>
        )}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 px-4 chat-scroll">
        {messages.map((message, index) => (
          <div
            key={`message-${message.role}-${index}`}
            className={`max-w-[80%] p-4 rounded-lg message-transition ${
              message.role === "user"
                ? "ml-auto bg-blue-100"
                : "mr-auto bg-white shadow-sm"
            }`}
          >
            <p className="text-sm font-semibold mb-1 text-gray-700">
              {message.role === "user" ? "You" : "Assistant"}
            </p>
            <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleChatSubmit} className="flex gap-2 p-4 bg-white rounded-lg shadow-sm">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 p-2 border rounded-lg custom-focus"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                  disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </main>
  );
}

export default App;