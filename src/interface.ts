// Define our message interfaces
export interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: string; // Add reasoning as optional property
}
  // Define our use cases and their corresponding temperatures
export interface UseCase {
    name: string;
    value: string;
    temperature: number;
    description: string;
  }