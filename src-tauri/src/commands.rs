// commands.rs
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::DeepseekState;  // This imports from lib.rs

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

#[tauri::command]
pub async fn send_deepseek_message(
    state: State<'_, DeepseekState>,
    request: ChatRequest,
) -> Result<String, String> {
    let url = format!("{}/v1/chat/completions", state.base_url);
    
    let client = state.create_client()
        .map_err(|e| e.to_string())?;

    let request_body = serde_json::json!({
        "model": "deepseek-reasoner",
        "messages": request.messages,
        "temperature": request.temperature,
        "stream": false
    });

    let response = client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let response_text = response
        .text()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response_text)
}

// Your existing greet command
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}