# Project Setup

To run the application:

Go to <https://www.deepseek.com> and sign up for an API key, put a dollar or so on your account, and then follow the steps below:

Follow the prerequisites page for Tauri:
<https://v2.tauri.app/start/prerequisites/>

Afterward, clone the repo, run npm install from the /src/ directory, and then add your api key to a .env file in the project root:

DEEPSEEK_API_KEY=

After that run "npm run tauri dev" and it should launch.

The current stack is:

- Rust (Tauri)
- React (Typescript) + TailwindCSS + Vite

To-do list:

- Add image upload capability to parse images
- Add the ability to download or save the response as a markdown file
- Use Tauri bundler to create both macOS .dmg and Windows .msi installers (build pipeline in progress)

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
