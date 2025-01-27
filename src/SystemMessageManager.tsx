import { useState, FormEvent, ChangeEvent } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { SystemMessageManagerProps } from './interface';

const SystemMessageManager: React.FC<SystemMessageManagerProps> = ({ 
  systemMessage, 
  setSystemMessage, 
  className = "" 
}) => {
  // Local state management
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState(systemMessage);
  const [isSaving, setIsSaving] = useState(false);

  // Properly typed event handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Update the system message in the backend
      await invoke('update_system_message', { newMessage: tempMessage });
      
      // Update local state
      setSystemMessage(tempMessage);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update system message:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for textarea changes with proper typing
  const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTempMessage(e.target.value);
  };

  return (
    <div className={`mb-4 p-4 bg-yellow-50 rounded-lg ${className}`}>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <label 
            htmlFor="system-message"
            className="text-sm font-semibold text-gray-700"
          >
            System Message (Context Cache)
          </label>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setTempMessage(systemMessage);
                setIsEditing(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              id="system-message"
              value={tempMessage}
              onChange={handleTextAreaChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Enter system message for context caching..."
              aria-label="System message input"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <div className="p-2 bg-white rounded border border-gray-200 min-h-[60px]">
              {systemMessage ? (
                <p className="text-sm text-gray-700">{systemMessage}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No system message set</p>
              )}
            </div>
            <p className="text-xs text-gray-500 italic">
              The system message is used for context caching. Consistent system messages can lead to 
              10x cheaper API costs through cache hits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemMessageManager;
