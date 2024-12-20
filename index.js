const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { Manager } = require('erela.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const ms = require('ms');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.config = {
  prefix: ',', // Custom prefix
  token: process.env.BOT_TOKEN, // Discord Bot Token
  devs: process.env.DEVELOPER_ID, // Add developer Discord IDs here
};

client.commands = new Collection();
client.aliases = new Collection(); 
client.devMode = false;
client.temporaryTesters = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);

  if (command.aliases && Array.isArray(command.aliases)) {
    command.aliases.forEach(alias => {
      client.aliases.set(alias, command.name);
    });
  }

}

client.manager = new Manager({
  nodes: [
    {
      host: process.env.LAVALINK_HOST,
      port: 443,
      password: process.env.LAVALINK_PASSWORD,
      secure: true,
    },
  ],
  
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
})
  .on('nodeConnect', node => console.log(`Node "${node.options.identifier}" connected.`))
  .on('nodeError', (node, error) => console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}`))
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
        .setFooter({ text: `Cmusics™`, iconURL: client.user.displayAvatarURL() });
      if (track.requestMessage) {
        try {
          await track.requestMessage.delete();
        } catch (error) {
          console.error('Could not delete request message:', error);
        }
      }
      
      channel.send({ embeds: [embed] });
    
    }
  });

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.manager.init(client.user.id);

  updateBotStatus();


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
});


function updateBotStatus() {
  const serverCount = client.guilds.cache.size;
  client.user.setActivity(`music in ${serverCount} servers | !help`, { type: 'PLAYING' });
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
    return message.reply('Bot is currently in maintenance mode. Please try again shortly.');
  }

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command.');
  }
});

client.login(client.config.token);

console.log('Bot is starting...');

