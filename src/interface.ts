// Define the message interfaces
export interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: string; // Add reasoning as optional property
}
  // Define the use cases and their corresponding temperatures
export interface UseCase {
    name: string;
    value: string;
    temperature: number;
    description: string;
  }

  // Define the props interface for our component
export interface SystemMessageManagerProps {
  systemMessage: string;
  setSystemMessage: (message: string) => void;
  className?: string;
}
