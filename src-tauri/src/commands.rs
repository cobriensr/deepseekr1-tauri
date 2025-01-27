// commands.rs
use serde::{Deserialize, Serialize};
use tauri::{command, State, Window};
use tauri::Runtime;
use tauri::Emitter;
use crate::DeepseekState;

// API response structures
#[derive(Debug, Serialize, Deserialize)]
struct StreamChunk {
    choices: Vec<Choice>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Choice {
    delta: Delta,
}

#[derive(Debug, Serialize, Deserialize)]
struct Delta {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    content: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    reasoning_content: Option<String>,
}

// Public interface structures
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub messages: Vec<Message>,
    pub temperature: f32,
}

#[derive(Debug, Serialize, Clone)]
struct CompleteMessage {
    content: String,
    reasoning: String,
}

#[command]
pub async fn send_deepseek_message<R: Runtime>(
    window: Window<R>,
    state: State<'_, DeepseekState>,
    request: ChatRequest,
) -> Result<(), String> {
    // Set up API request
    let url = format!("{}/v1/chat/completions", state.base_url);
    let client = state.create_client()
        .map_err(|e| e.to_string())?;

    let request_body = serde_json::json!({
        "model": "deepseek-reasoner",
        "messages": request.messages,
        "temperature": request.temperature,
        "stream": true
    });

    println!("Sending request to DeepSeek API");
    let mut response = client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    println!("Received response from API");
    
    // Initialize our content buffers
    let mut content_buffer = String::new();
    let mut reasoning_buffer = String::new();
    
    // Process the streaming response
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        let chunk_str = String::from_utf8_lossy(&chunk);
        
        for line in chunk_str.lines() {
            if !line.starts_with("data: ") {
                continue;
            }

            let json_str = &line[6..];
            if json_str == "[DONE]" {
                println!("Received [DONE] signal");
                continue;
            }

            println!("Processing chunk: {}", json_str);

            match serde_json::from_str::<StreamChunk>(json_str) {
                Ok(parsed) => {
                    if let Some(choice) = parsed.choices.first() {
                        // Process reasoning content first
                        if let Some(reason) = &choice.delta.reasoning_content {
                            if !reason.is_empty() {
                                reasoning_buffer.push_str(reason);
                                // Emit reasoning content immediately for streaming display
                                println!("Streaming reasoning: {}", reason);
                                window.emit("streaming-reasoning", reason)
                                    .map_err(|e| e.to_string())?;
                            }
                        }
                        
                        // Process main content second
                        if let Some(content) = &choice.delta.content {
                            if !content.is_empty() {
                                content_buffer.push_str(content);
                                // Emit content immediately for streaming display
                                println!("Streaming content: {}", content);
                                window.emit("streaming-content", content)
                                    .map_err(|e| e.to_string())?;
                            }
                        }
                    }
                }
                Err(e) => {
                    println!("Error parsing chunk: {}", e);
                    println!("Problematic JSON: {}", json_str);
                }
            }
        }
    }

    // Send the complete message with both content and reasoning
    let complete_message = CompleteMessage {
        content: content_buffer.clone(),
        reasoning: reasoning_buffer.clone(),
    };

    // Log the final state for debugging
    println!("Stream processing completed");
    println!("Final reasoning: {}", reasoning_buffer);
    println!("Final content: {}", content_buffer);

    // Emit the complete message to the frontend
    window.emit("streaming-complete", complete_message)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn update_system_message(
    state: State<'_, DeepseekState>,
    new_message: String,
) -> Result<(), String> {
    println!("Updating system message: {}", new_message);
    state.update_system_message(new_message)
        .map_err(|e| e.to_string())
}

#[command]
pub fn get_system_message(
    state: State<'_, DeepseekState>,
) -> Result<String, String> {
    state.get_system_message()
        .map_err(|e| e.to_string())
}