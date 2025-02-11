const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Manager } = require('erela.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const ms = require('ms');
const Spotify = require("erela.js-spotify");


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.config = {
  prefix: ',',
  token: process.env.BOT_TOKEN,
  devs: process.env.DEVELOPER_ID,
  logChannel: process.env.CHANNEL_ID,
};

let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 5000;

client.commands = new Collection();
client.aliases = new Collection(); 
client.devMode = false;
client.temporaryTesters = new Map();

const categories = ['admin', 'player', 'util'];

categories.forEach(category => {
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', category)).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', category, file));
    client.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => client.aliases.set(alias, command.name));
    }
  }
});

function sendLogEmbed(channel, embed) {
  channel.send({ embeds: [embed] }).catch(console.error);
}

const spotifyOptions = {
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
};

client.manager = new Manager({
  nodes: [
    {
      host: process.env.LAVALINK_HOST,
      port: parseInt(process.env.LAVALINK_PORT),
      password: process.env.LAVALINK_PASSWORD,
      secure: process.env.LAVALINK_SECURE === 'true',
    },
  ],
  plugins: [
    new Spotify(spotifyOptions)
  ],
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
})
.on('nodeConnect', node => {
  console.log(`Node "${node.options.identifier}" connected.`);
  reconnectionAttempts = 0;
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🟢 Lavalink Node Connected')
    .setDescription(`Node "${node.options.identifier}" has successfully connected.`)
    .setTimestamp();
  sendLogEmbed(client.channels.cache.get(client.config.logChannel), embed);
})
.on('nodeError', (node, error) => {
  console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}`);
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🔴 Lavalink Node Error')
    .setDescription(`Node "${node.options.identifier}" encountered an error.`)
    .addFields({ name: 'Error Message', value: error.message })
    .setTimestamp();
  sendLogEmbed(client.channels.cache.get(client.config.logChannel), embed);
})
.on('nodeDisconnect', (node) => {
  console.log(`Node "${node.options.identifier}" disconnected.`);
  attemptReconnection(node);

  const embed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('🟠 Lavalink Node Disconnected')
    .setDescription(`Node "${node.options.identifier}" has disconnected. Attempting to reconnect...`)
    .setTimestamp();
  sendLogEmbed(client.channels.cache.get(client.config.logChannel), embed);
})
.on('trackStart', async (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('🎵 Now Playing')
      .setDescription(`[${track.title}](${track.uri})`)
      .setThumbnail(track.thumbnail || null)
      .addFields(
        { name: 'Duration', value: formatDuration(track.duration), inline: true },
        { name: 'Requested by', value: `<@${track.requester.id}>`, inline: true }
      )
      .setFooter({ text: 'CMusics™', iconURL: client.user.displayAvatarURL() });

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('⏮️ Previous')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('pauseplay')
          .setLabel(player.playing ? '⏸️ Pause' : '▶️ Play')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('disconnect')
          .setLabel('⏹️ Stop')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('skip')
          .setLabel('⏭️ Skip')
          .setStyle(ButtonStyle.Primary),
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('seek_backward')
          .setLabel('   ⏪ 10s    ')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('empty')
          .setLabel('  ⬜ ') 
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('seek_forward')
          .setLabel('   ⏩ 10s   ')
          .setStyle(ButtonStyle.Secondary)
      );

    if (player.nowPlayingMessage) {
      try {
        await player.nowPlayingMessage.edit({ embeds: [embed], components: [row1,row2] });
      } catch (error) {
        console.error('Error editing now playing message:', error);
        player.nowPlayingMessage = await channel.send({ embeds: [embed], components: [row1,row2] });
      }
    } else {
      player.nowPlayingMessage = await channel.send({ embeds: [embed], components: [row1,row2] });
    }
  }
})
.on('queueEnd', player => {
  if (player.nowPlayingMessage) {
    player.nowPlayingMessage.delete().catch(console.error);
    player.nowPlayingMessage = null;
  }

 
})
.on('trackEnd', (player, track, payload) => {
  if (player.queue.length === 0) {
    if (player && !player.playing && !player.paused && !player.queue.length) {
      player.destroy();
    }
  }
})
.on('playerMove', (player, oldChannel, newChannel) => {
  if (!newChannel) {
    player.destroy();
  }
});



client.on('voiceStateUpdate', (oldState, newState) => {
  const player = client.manager.get(oldState.guild.id);
  if (!player) return;

  if (oldState.channel && !newState.channel) {
    if (oldState.channel.id === player.voiceChannel) {
      const vcMembers = oldState.channel.members.filter(m => !m.user.bot).size;
      if (vcMembers === 0) {
        player.pause(true);
        setTimeout(() => {
          if (player && player.paused && oldState.channel.members.filter(m => !m.user.bot).size === 0) {
            player.destroy();
          }
        }, 5 * 60 * 1000);
      }
    }
  } else if (!oldState.channel && newState.channel) {
    if (newState.channel.id === player.voiceChannel && player.paused) {
      player.pause(false);
    }
  }
});

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const player = client.manager.get(interaction.guildId);
  if (!player) return;

  try {
    switch (interaction.customId) {
      case 'previous':
        if (player.queue.previous) {
          player.queue.unshift(player.queue.previous);
          player.stop();
        }
        await interaction.deferUpdate();
        break;
      case 'pauseplay':
        player.pause(!player.paused);
        const row = new ActionRowBuilder();
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('seek_backward')
            .setLabel('⏪ 10s')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('⏮️ Previous')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('pauseplay')
            .setLabel(player.paused ? '▶️ Play' : '⏸️ Pause')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('disconnect')
            .setLabel('🔌 Disconnect')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('skip')
            .setLabel('⏭️ Skip')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('seek_forward')
            .setLabel('⏩ 10s')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('empty')
            .setLabel('⬜')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
        await interaction.update({ components: [row] });
        break;
      case 'skip':
        player.stop();
        break;
      case 'disconnect':
        player.queue.clear();
        player.destroy();
        break;
      case 'seek_backward':
      case 'seek_forward':
        const seekAmount = interaction.customId === 'seek_backward' ? -10000 : 10000;
        const newPosition = Math.max(0, Math.min(player.position + seekAmount, player.queue.current.duration));
        player.seek(newPosition);
        break;
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true }).catch(console.error);
    }
  }

  if (interaction.customId !== 'pauseplay') {
    await interaction.deferUpdate();
  }
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.manager.init(client.user.id);


  setInterval(() => {
    updateBotStatus();
  }, 30000); 

  const embed = new EmbedBuilder()
    .setColor('#00FFFF')
    .setTitle('🚀 Bot Online')
    .setDescription(`${client.user.tag} is now online and ready!`)
    .addFields(
      { name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
      { name: 'Users', value: client.users.cache.size.toString(), inline: true },
      { name: 'Channels', value: client.channels.cache.size.toString(), inline: true }
    )
    .setTimestamp();
  sendLogEmbed(client.channels.cache.get(client.config.logChannel), embed);

  for (const [userId, expirationTime] of client.temporaryTesters.entries()) {
    const remainingTime = expirationTime - Date.now();
    if (remainingTime > 0) {
      setTimeout(() => {
        client.temporaryTesters.delete(userId);
        const expiredEmbed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('🚫 CMusics™ Tester Status Expired')
          .setDescription('Your temporary tester status for CMusics™ has expired.')
          .addFields(
            { name: 'Duration', value: 'Expired', inline: true }
          )
          .setFooter({ text: 'Thank you for your help in testing CMusics™!' })
          .setTimestamp();
        client.users.fetch(userId).then(user => {
          user.send({ embeds: [expiredEmbed] }).catch(() => {});
        });
      }, remainingTime);
    } else {
      client.temporaryTesters.delete(userId);
    }
  }

  client.channels.cache.get(client.config.logChannel)?.send('Bot is now online and ready!');
});

function updateBotStatus() {
  const serverCount = client.guilds.cache.size;
  
  // Randomly switch between "Back soon" and "music in X servers"
  const activities = [
    `music in ${serverCount} servers | ,help`,
    `,p or ,play to listen music | ,help`,
  ];
  
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];

  // Set the bot activity status
  client.user.setActivity(randomActivity);
}

function attemptReconnection(node) {
  if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
    reconnectionAttempts++;
    setTimeout(() => {
      console.log(`Attempting to reconnect to node "${node.options.identifier}" (Attempt ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`);
      node.connect();
    }, RECONNECTION_DELAY);
  } else {
    console.error(`Failed to reconnect to node "${node.options.identifier}" after ${MAX_RECONNECTION_ATTEMPTS} attempts. Restarting the bot...`);
    restartBot();
  }
}

function restartBot() {
  console.log("Restarting the bot...");
  client.destroy();
  process.exit(1); // This will exit the process, which should trigger a restart if you're using a process manager like PM2
}

// Update status every 5 minutes
setInterval(updateBotStatus, 5 * 60 * 1000);

client.on('raw', d => client.manager.updateVoiceState(d));

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(client.config.prefix)) return;

  const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));

  if (!command) return;

  const isTemporaryTester = client.temporaryTesters.has(message.author.id);
  if (client.devMode && !client.config.devs.includes(message.author.id) && !isTemporaryTester) {
    return message.reply('⚙️ The bot is currently under development 🛠️. Thank you for your patience as we work hard to bring you the new version! 🚀');
  }

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command.');
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⚠️ Command Execution Error')
      .setDescription(`An error occurred while executing the \`${commandName}\` command.`)
      .addFields(
        { name: 'User', value: message.author.tag, inline: true },
        { name: 'Channel', value: message.channel.name, inline: true },
        { name: 'Guild', value: message.guild.name, inline: true },
        { name: 'Error Message', value: error.message }
      )
      .setTimestamp();
    sendLogEmbed(client.channels.cache.get(client.config.logChannel), embed);
  }
});

client.on('guildCreate', (guild) => {
  console.log(`Joined a new guild: ${guild.name}`);
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎉 Joined New Server')
    .setDescription(`${client.user.tag} has been added to a new server!`)
    .addFields(
      { name: 'Server Name', value: guild.name, inline: true },
      { name: 'Server ID', value: guild.id, inline: true },
      { name: 'Member Count', value: guild.memberCount.toString(), inline: true },
      { name: 'Owner', value: guild.ownerId ? `<@${guild.ownerId}>` : 'Unknown', inline: true }
    )
    .setThumbnail(guild.iconURL({ dynamic: true, size: 128 }))
    .setTimestamp();
  sendLogEmbed(client.channels.cache.get(client.config.logChannel), embed);
});

client.on('guildDelete', (guild) => {
  console.log(`Left a guild: ${guild.name}`);
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('👋 Left Server')
    .setDescription(`${client.user.tag} has been removed from a server.`)
    .addFields(
      { name: 'Server Name', value: guild.name, inline: true },
      { name: 'Server ID', value: guild.id, inline: true }
    )
    .setThumbnail(guild.iconURL({ dynamic: true, size: 128 }))
    .setTimestamp();
  sendLogEmbed(client.channels.cache.get(client.config.logChannel), embed);
});

client.on("raw", d => client.manager.updateVoiceState(d));

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.login(client.config.token);

console.log('Bot is starting...');