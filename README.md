# 🎵 Discord Music Bot

A powerful, feature-rich, and easy-to-use music bot for Discord, built using Node.js and Discord.js. This bot allows users to enjoy high-quality music streaming directly in their Discord servers, with advanced features like queue management, customizable settings, and seamless integration with popular music sources.

## ✨ Features

- 🎶 **Play Music**: Stream music from YouTube, Spotify, and other sources.
- 📜 **Queue Management**: View, reorder, and clear the music queue effortlessly.
- 🔄 **Lavalink Integration**: Leverages the Lavalink music node for high-performance audio playback.
- 🎛 **User Commands**: Intuitive commands to control playback (play, pause, skip, stop, etc.).
- 🌟 **Rich Embeds**: Beautiful now-playing and queue embeds to enhance the user experience.
- 🔊 **Volume Control**: Fine-tune the volume as you like.
- 🛠 **Customizable**: Easily modify the bot's behavior to suit your needs.
- 🖥 **Dynamic Status**: Displays the bot’s current activity (e.g., playing music in servers).

## 🛠️ Setup

1. Clone the repository:
   ```bash
   [git clone https://github.com/your-username/discord-music-bot.git](https://github.com/Chamidu-Maduwantha/Discord-Music-Bot.git)

2. Navigate to the project directory:
   ```bash
   cd discord-music-bot

3. Install the required dependencies:  
   ```bash
   npm install

4. Set up your `.env` file with the following variables:
   ```plaintext
   BOT_TOKEN=your-discord-bot-token
   DEVELOPER_ID=your-discord-user-id

5. Run the bot:  
   ```bash
   node index.js
   


## Commands Table

| Command            | Description                                      | Example Usage         |
|---------------------|--------------------------------------------------|-----------------------|
| `,play <song>`      | Plays a song from YouTube or a URL.              | `,play Despacito`     |
| `,pause`            | Pauses the current song.                        | `,pause`             |
| `,resume`           | Resumes the paused song.                        | `,resume`            |
| `,skip`             | Skips the current song.                         | `,skip`              |
| `,stop`             | Stops playback and clears the queue.            | `,stop`              |
| `,queue`            | Displays the current song queue.                | `,queue`             |
| `,np`               | Shows the currently playing song.               | `,np`                |
| `,volume <1-100>`   | Adjusts the bot's playback volume.              | `,volume 50`         |
| `,help`             | Displays the list of available commands.        | `,help`              |



## License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for more details.

