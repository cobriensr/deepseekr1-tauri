// Define our message interfaces for better type safety
export interface DisplayMessage {
    role: "user" | "assistant";
    content: string;
  }
  
  // Define our use cases and their corresponding temperatures
export interface UseCase {
    name: string;
    value: string;
    temperature: number;
    description: string;
  }