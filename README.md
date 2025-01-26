To run the application:

Go to deepseek.com and sign up for an api key, put a dollar or so on your account and then follow the steps below:

Follow the prerequisites page for Tauri:
https://v2.tauri.app/start/prerequisites/

Afterwards clone the repo, run npm install from the /src/ directory and then add your api key to lib.rs line 15 in src-tauri/src/lib.rs:

            api_key: String::from("")

After that run "npm run tauri dev" and it should launch.

The current stack is:
- Rust (Tauri)
- React (Typescript) + TailwindCSS + Vite

To do list:
- Add temperature parameter selection to main chat window to guide responses based on temperature float
- Add streaming to the response so you don't watch a window until the response comes through
- Have Rust pull API key from a .env file in project root instead of manually defining it

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
