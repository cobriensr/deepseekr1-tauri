// lib.rs
mod commands;
use dotenv::dotenv;
use reqwest::{Client, header};
use std::env;
use std::error::Error;

pub struct DeepseekState {
    api_key: String,
    base_url: String,
}

impl DeepseekState {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        // Load environment variables from .env file
        dotenv().ok();
        
        // Get API key from environment variable with proper error handling
        let api_key = env::var("DEEPSEEK_API_KEY")
            .map_err(|_| "DEEPSEEK_API_KEY environment variable not set")?;
            
        Ok(DeepseekState {
            api_key,
            base_url: String::from("https://api.deepseek.com"),
        })
    }

    pub fn create_client(&self) -> Result<Client, Box<dyn Error>> {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", self.api_key))?,
        );
        
        Ok(Client::builder()
            .default_headers(headers)
            .build()?)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let deepseek_state = DeepseekState::new()
        .expect("Failed to create DeepseekState: Environment variables not properly configured");
        
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(deepseek_state)
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::send_deepseek_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}