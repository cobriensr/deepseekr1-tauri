// lib.rs

// First, we declare our commands module publicly so its contents can be accessed
pub mod commands;

use dotenv::dotenv;
use std::sync::RwLock;
use reqwest::{Client, header};
use std::env;
use std::error::Error;

// Our main state struct for managing the DeepSeek client
pub struct DeepseekState {
    pub api_key: String,
    pub base_url: String,
    pub system_message: RwLock<String>,
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
            system_message: RwLock::new(String::new()),
        })
    }

    pub fn create_client(&self) -> Result<Client, Box<dyn Error>> {
        let mut headers = header::HeaderMap::new();
        
        // Create the authorization header value
        let auth_value = format!("Bearer {}", self.api_key);
        let mut auth_header = header::HeaderValue::from_str(&auth_value)?;
        auth_header.set_sensitive(true);
        
        headers.insert(header::AUTHORIZATION, auth_header);
        
        // Add content type header
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/json"),
        );

        Ok(Client::builder()
            .default_headers(headers)
            .build()?)
    }

    pub fn get_system_message(&self) -> Result<String, Box<dyn Error>> {
        Ok(self.system_message.read()
            .map_err(|e| format!("Failed to read system message: {}", e))?
            .clone())
    }

    pub fn update_system_message(&self, new_message: String) -> Result<(), Box<dyn Error>> {
        let mut message = self.system_message.write()
            .map_err(|e| format!("Failed to acquire write lock: {}", e))?;
        *message = new_message;
        Ok(())
    }
}

// The main application entry point and setup
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create our application state
    let deepseek_state = DeepseekState::new()
        .expect("Failed to create DeepseekState: Environment variables not properly configured");

    // Build and run the Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(deepseek_state)
        // Use the generate_handler macro with our command functions
        .invoke_handler(tauri::generate_handler![
            commands::send_deepseek_message,
            commands::update_system_message,
            commands::get_system_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}