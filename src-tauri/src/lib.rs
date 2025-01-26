// lib.rs
mod commands;
use dotenv::dotenv;
use std::sync::RwLock;
use reqwest::{Client, header};
use std::env;
use std::error::Error;

pub struct DeepseekState {
    api_key: String,
    base_url: String,
    system_message: RwLock<String>,  // Wrap in RwLock for thread-safe mutability
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
                // Initialize with an empty string
                system_message: RwLock::new(String::new()),
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
            // Method to get the system message
        pub fn get_system_message(&self) -> Result<String, Box<dyn Error>> {
            Ok(self.system_message.read()
                .map_err(|e| format!("Failed to read system message: {}", e))?
                .clone())
        }

        // Method to update the system message
        pub fn update_system_message(&self, new_message: String) -> Result<(), Box<dyn Error>> {
            let mut message = self.system_message.write()
                .map_err(|e| format!("Failed to acquire write lock: {}", e))?;
            *message = new_message;
            Ok(())
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
            commands::send_deepseek_message,
            commands::update_system_message,
            commands::get_system_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}