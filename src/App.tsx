// app.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { markdownComponents, reasoningComponents } from './MarkdownComponent';
import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { DisplayMessage, UseCase } from "./interface";
import { USE_CASES } from "./constant";
import SystemMessageManager from "./SystemMessageManager";
import "./App.css";

function App() {
  // Core state management
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [systemMessage, setSystemMessage] = useState<string>("");
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase>(USE_CASES[0]);
  
  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Streaming state
  const [currentContent, setCurrentContent] = useState("");
  const [currentReasoning, setCurrentReasoning] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Refs for maintaining state in event listeners
  const messagesRef = useRef<DisplayMessage[]>([]);
  const streamingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    streamingRef.current = isStreaming;
  }, [isStreaming]);

  // Initialize system message
  useEffect(() => {
    const initializeSystemMessage = async () => {
      try {
        const message = await invoke<string>("get_system_message");
        if (message) {
          setSystemMessage(message);
        }
      } catch (error) {
        console.error("Failed to fetch system message:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSystemMessage();
  }, []);

  // Set up streaming event listeners
  useEffect(() => {
    let contentAccumulator = "";
    let reasoningAccumulator = "";
    let isMounted = true;
  
    const setupListeners = async () => {
      // Listen for reasoning content first
      const unlistenReasoning = await listen<string>("streaming-reasoning", (event) => {
        if (!isMounted) return;
        
        // Start streaming mode when we get reasoning
        if (!streamingRef.current) {
          setIsStreaming(true);
        }
        
        reasoningAccumulator += event.payload;
        setCurrentReasoning(reasoningAccumulator);
      });
  
      // Then listen for regular content
      const unlistenContent = await listen<string>("streaming-content", (event) => {
        if (!isMounted) return;
        
        // Ensure streaming mode is on
        if (!streamingRef.current) {
          setIsStreaming(true);
        }
        
        contentAccumulator += event.payload;
        setCurrentContent(contentAccumulator);
      });
  
      // Handle completion
      const unlistenComplete = await listen<{ content: string, reasoning: string }>(
        "streaming-complete", 
        (event) => {
          if (!isMounted) return;
  
          const completeMessage = event.payload;
          
          // Add to conversation history
          setMessages(prevMessages => [...prevMessages, {
            role: "assistant",
            content: completeMessage.content,
            reasoning: completeMessage.reasoning
          }]);
  
          // Reset all states
          setIsStreaming(false);
          setCurrentContent("");
          setCurrentReasoning("");
          contentAccumulator = "";
          reasoningAccumulator = "";
        }
      );
  
      return () => {
        isMounted = false;
        unlistenReasoning();
        unlistenContent();
        unlistenComplete();
      };
    };
  
    const cleanupPromise = setupListeners();
    return () => {
      cleanupPromise.then(cleanup => cleanup());
    };
  }, []);

  // Handle use case selection
  const handleUseCaseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newUseCase = USE_CASES.find(uc => uc.value === event.target.value);
    if (newUseCase) {
      setSelectedUseCase(newUseCase);
    }
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);

    // Create and add user message
    const newMessage: DisplayMessage = {
      role: "user",
      content: inputMessage.trim()
    };

    // Update messages with user input
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputMessage("");

    try {
      // Get current messages from ref to ensure latest state
      const currentMessages = messagesRef.current;
      
      // Prepare API request
      const apiMessages = [
        { role: "system", content: systemMessage },
        ...currentMessages,
        newMessage
      ];

      // Send request to API
      await invoke("send_deepseek_message", {
        request: {
          messages: apiMessages,
          temperature: selectedUseCase.temperature
        }
      });
    } catch (error) {
      console.error("Error in submission:", error);
      setMessages(prevMessages => [...prevMessages, {
        role: "assistant",
        content: "Error processing request"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading system configuration...</p>
      </div>
    );
  }

  // Main UI
  return (
    <main className="flex flex-col h-screen p-4 bg-gray-50">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Deepseek Chat Interface</h1>
        <p className="text-gray-600">Ask questions or request assistance below</p>
      </header>

      <SystemMessageManager 
        systemMessage={systemMessage}
        setSystemMessage={setSystemMessage}
      />

      {/* Use Case Selector */}
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
        {/* Render existing messages */}
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
            
            {message.reasoning && (
              <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Reasoning:</p>
                <ReactMarkdown
                  className="prose prose-sm max-w-none text-gray-600"
                  remarkPlugins={[remarkGfm]}
                  components={reasoningComponents}
                >
                  {message.reasoning}
                </ReactMarkdown>
              </div>
            )}

            <ReactMarkdown
              className="prose max-w-none"
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}

        {/* Show streaming response */}
        {isStreaming && (
          <div className="max-w-[80%] p-4 rounded-lg mr-auto bg-white shadow-sm">
            <p className="text-sm font-semibold mb-1">Assistant</p>
            
            {/* Show reasoning section whenever we're streaming, even if content is empty */}
            <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Reasoning:</p>
              <ReactMarkdown
                className="prose prose-sm max-w-none text-gray-600"
                remarkPlugins={[remarkGfm]}
              >
                {currentReasoning || 'Thinking...'}
              </ReactMarkdown>
            </div>
            
            {/* Show content section if we have any */}
            {currentContent && (
              <ReactMarkdown
                className="prose max-w-none"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {currentContent}
              </ReactMarkdown>
            )}
            
            <span className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse" />
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