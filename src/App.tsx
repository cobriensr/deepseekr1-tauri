// app.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

// Define our message interfaces for better type safety
interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

// Define our use cases and their corresponding temperatures
interface UseCase {
  name: string;
  value: string;
  temperature: number;
  description: string;
}

const USE_CASES: UseCase[] = [
  {
    name: "General Conversation",
    value: "general",
    temperature: 1.3,
    description: "Balanced responses for everyday conversation"
  },
  {
    name: "Coding & Math",
    value: "coding",
    temperature: 0.0,
    description: "Precise, deterministic responses for technical tasks"
  },
  {
    name: "Data Analysis",
    value: "data",
    temperature: 1.0,
    description: "Balanced analysis for data processing tasks"
  },
  {
    name: "Translation",
    value: "translation",
    temperature: 1.3,
    description: "Natural language translation tasks"
  },
  {
    name: "Creative Writing",
    value: "creative",
    temperature: 1.5,
    description: "More creative and varied responses"
  }
];

function App() {
  // State management for the chat interface
  const [systemMessage, setSystemMessage] = useState<string>("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // State management for the use cases
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase>(USE_CASES[0]);

  // State for the current streaming response
  const [currentContent, setCurrentContent] = useState("");
  const [currentReasoning, setCurrentReasoning] = useState("");

  // Function to handle use case changes
  const handleUseCaseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newUseCase = USE_CASES.find(uc => uc.value === event.target.value);
    if (newUseCase) {
      setSelectedUseCase(newUseCase);
    }
  };

  // Set up event listeners for streaming content
  useEffect(() => {
    let contentAccumulator = "";
    let reasoningAccumulator = "";
    console.log("Setting up event listeners...");
  
    const setupListeners = async () => {
      // Listen for content updates
      const unlistenContent = await listen<string>("streaming-content", (event) => {
        console.log("Received content chunk:", event.payload);
        contentAccumulator += event.payload;
        setCurrentContent(contentAccumulator);
      });
  
      // Listen for reasoning updates
      const unlistenReasoning = await listen<string>("streaming-reasoning", (event) => {
        console.log("Received reasoning chunk:", event.payload);
        reasoningAccumulator += event.payload;
        setCurrentReasoning(reasoningAccumulator);
      });
  
      return () => {
        console.log("Cleaning up listeners");
        unlistenContent();
        unlistenReasoning();
      };
    };
  
    const cleanup = setupListeners();
    return () => {
      cleanup.then(cleanupFn => cleanupFn());
    };
  }, []);

  // Initialize system message
  useEffect(() => {
    const initializeSystemMessage = async () => {
      try {
        const message = await invoke<string>("get_system_message");
        if (message) {
          setSystemMessage(message);
        }
        console.log("System message initialized:", message);
      } catch (error) {
        console.error("Failed to fetch system message:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSystemMessage();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
  
    setIsLoading(true);
    console.log("Submitting message:", inputMessage.trim());
    console.log("Submitting message with temperature:", selectedUseCase.temperature);
  
    // Clear current content
    setCurrentContent("");
    setCurrentReasoning("");
  
    // Create the new message
    const newMessage: DisplayMessage = {
      role: "user",
      content: inputMessage.trim()
    };
  
    // Update messages immediately
    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
  
    try {
      // Prepare all messages
      const apiMessages = [
        { role: "system", content: systemMessage },
        ...messages,
        newMessage
      ];
  
      console.log("Sending request to backend");
      await invoke("send_deepseek_message", {
        request: {
          messages: apiMessages,
          temperature: selectedUseCase.temperature // Use the selected temperature
        }
      });
      console.log("Request completed");
  
    } catch (error) {
      console.error("Error in submission:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while initializing
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

      {/* Add Use Case Selector */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex flex-col space-y-2">
          <label htmlFor="useCase" className="text-sm font-semibold text-gray-700">
            Conversation Type
          </label>
          <select
            id="useCase"
            value={selectedUseCase.value}
            onChange={handleUseCaseChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {USE_CASES.map(useCase => (
              <option key={useCase.value} value={useCase.value}>
                {useCase.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 italic">
            Temperature: {selectedUseCase.temperature} - {selectedUseCase.description}
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 px-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[80%] p-4 rounded-lg ${
              message.role === "user" ? "ml-auto bg-blue-100" : "mr-auto bg-white shadow-sm"
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {message.role === "user" ? "You" : "Assistant"}
            </p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}

        {/* Current streaming response */}
        {(currentContent || currentReasoning) && (
          <div className="max-w-[80%] p-4 rounded-lg mr-auto bg-white shadow-sm">
            <p className="text-sm font-semibold mb-1">Assistant</p>
            {currentReasoning && (
              <div className="mb-2 text-gray-600 italic bg-gray-50 p-2 rounded">
                Reasoning: {currentReasoning}
              </div>
            )}
            {currentContent && (
              <p className="whitespace-pre-wrap">
                {currentContent}
                <span className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse"/>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-white rounded-lg shadow-sm">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 p-2 border rounded-lg"
          placeholder={isLoading ? "Please wait..." : "Type your message..."}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}

export default App;