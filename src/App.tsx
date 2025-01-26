// app.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

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
  // Initialize systemMessage as empty and load it from the backend
  const [systemMessage, setSystemMessage] = useState<string>("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingSystem, setIsEditingSystem] = useState(false);
  // Add state for error handling
  const [systemUpdateError, setSystemUpdateError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Add useEffect to fetch the initial system message when the component mounts
  useEffect(() => {
    const initializeSystemMessage = async () => {
      try {
        const message = await invoke<string>("get_system_message");
        setSystemMessage(message);
      } catch (error) {
        console.error("Failed to fetch initial system message:", error);
        setSystemUpdateError("Failed to load system message. Please refresh the page.");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSystemMessage();
  }, []);

  // Update the message preparation function
  const prepareApiMessages = (conversationMessages: DisplayMessage[]): ChatMessage[] => {
    return [
      { role: "system", content: systemMessage },
      ...conversationMessages
    ];
  };

  // Update the chat submission handler
  async function handleChatSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);

    const newDisplayMessages: DisplayMessage[] = [
      ...messages,
      { role: "user", content: inputMessage.trim() }
    ];
    setMessages(newDisplayMessages);
    setInputMessage("");

    try {
      const apiMessages = prepareApiMessages(newDisplayMessages);
      
      const response = await invoke<string>("send_deepseek_message", {
        request: {
          messages: apiMessages,
          temperature: 1.0
        }
      });

      const responseData = JSON.parse(response) as ApiResponse;
      const assistantMessage = responseData.choices[0].message;

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

  // Update the system message handler to communicate with the backend
  const handleSystemMessageUpdate = async (newMessage: string) => {
    try {
      await invoke("update_system_message", { newMessage });
      setSystemMessage(newMessage);
      setIsEditingSystem(false);
      setSystemUpdateError(null);
    } catch (error) {
      console.error("Failed to update system message:", error);
      setSystemUpdateError("Failed to update system message. Please try again.");
    }
  };

  // Add a cancel handler for system message editing
  const handleCancelSystemEdit = () => {
    setIsEditingSystem(false);
    setSystemUpdateError(null);
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading system configuration...</p>
      </div>
    );
  }

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
            onClick={() => isEditingSystem ? handleSystemMessageUpdate(systemMessage) : setIsEditingSystem(true)}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {isEditingSystem ? 'Save' : 'Edit'}
          </button>
        </div>
        {isEditingSystem ? (
          <div className="space-y-2">
            <textarea
              value={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelSystemEdit}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSystemMessageUpdate(systemMessage)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
            {systemUpdateError && (
              <p className="text-red-500 text-sm mt-2">{systemUpdateError}</p>
            )}
          </div>
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

      {/* Input Form */}
      <form onSubmit={handleChatSubmit} className="flex gap-2 p-4 bg-white rounded-lg shadow-sm">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 p-2 border rounded-lg custom-focus"
          placeholder={isLoading ? "Please wait..." : "Type your message..."}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !systemMessage}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                  disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}

export default App;