// lib.rs
use dotenv::dotenv;
use std::sync::RwLock;
use reqwest::{Client, header};
use std::env;
use std::error::Error;

// Make our commands module public so its contents can be accessed
pub mod commands;

// Main state struct for managing DeepSeek client and shared state
pub struct DeepseekState {
    pub api_key: String,
    pub base_url: String,
    pub system_message: RwLock<String>,
}

impl DeepseekState {
    // Initialize new DeepseekState with environment configuration
    pub fn new() -> Result<Self, Box<dyn Error>> {
        // Load environment variables from .env file
        dotenv().ok();
        
        // Get API key from environment with proper error handling
        let api_key = env::var("DEEPSEEK_API_KEY")
            .map_err(|_| "DEEPSEEK_API_KEY environment variable not set")?;
        
        // Create new state instance with empty system message
        Ok(DeepseekState {
            api_key,
            base_url: String::from("https://api.deepseek.com"),
            system_message: RwLock::new(String::new()),
        })
    }

    // Create an HTTP client with proper authentication headers
    pub fn create_client(&self) -> Result<Client, Box<dyn Error>> {
        let mut headers = header::HeaderMap::new();
        
        // Set up authentication header
        let auth_value = format!("Bearer {}", self.api_key);
        let mut auth_header = header::HeaderValue::from_str(&auth_value)?;
        auth_header.set_sensitive(true);
        
        // Add required headers for API communication
        headers.insert(header::AUTHORIZATION, auth_header);
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/json"),
        );
        
        // Build and return the configured client
        Ok(Client::builder()
            .default_headers(headers)
            .build()?)
    }

    // Thread-safe access to read system message
    pub fn get_system_message(&self) -> Result<String, Box<dyn Error>> {
        Ok(self.system_message.read()
            .map_err(|e| format!("Failed to read system message: {}", e))?
            .clone())
    }

    // Thread-safe access to update system message
    pub fn update_system_message(&self, new_message: String) -> Result<(), Box<dyn Error>> {
        let mut message = self.system_message.write()
            .map_err(|e| format!("Failed to acquire write lock: {}", e))?;
        *message = new_message;
        Ok(())
    }
}

// Main application entry point
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize application state
    let deepseek_state = DeepseekState::new()
        .expect("Failed to create DeepseekState: Environment variables not properly configured");

    // Configure and launch Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(deepseek_state)
        // Register command handlers using the macro
        .invoke_handler(tauri::generate_handler![
            commands::send_deepseek_message,
            commands::update_system_message,
            commands::get_system_message,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}