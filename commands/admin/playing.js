const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'playing',
  aliases: ['active', 'listening'],
  description: 'Shows servers where the bot is currently playing music (Developer only)',
  async execute(message, args, client) {
    // Check if the user has developer privileges
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    // Get all active players
    const players = client.manager.players;
    
    if (players.size === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('📊 Music Activity Monitor')
        .setDescription('```diff\n- No active music sessions at the moment\n```')
        .setFooter({ 
          text: `Requested by ${message.author.tag}`, 
          iconURL: message.author.displayAvatarURL() 
        })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    let totalListeners = 0;
    let activeServers = [];

    // Collect data from each active player
    for (const [guildId, player] of players) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      const voiceChannel = guild.channels.cache.get(player.voiceChannel);
      if (!voiceChannel) continue;

      // Count members in voice channel (excluding bots)
      const listeners = voiceChannel.members.filter(member => !member.user.bot).size;
      totalListeners += listeners;

      const track = player.queue.current;
      activeServers.push({
        name: guild.name,
        listeners: listeners,
        channel: voiceChannel.name,
        track: track ? track.title : 'Unknown',
        memberCount: guild.memberCount
      });
    }

    // Sort by listener count
    activeServers.sort((a, b) => b.listeners - a.listeners);

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('📊 Music Activity Monitor')
      .setDescription(`\`\`\`diff
+ Total Active Sessions: ${players.size}
+ Total Current Listeners: ${totalListeners}
+ Average Listeners per Server: ${(totalListeners / players.size).toFixed(1)}
\`\`\``)
      .addFields({
        name: '🎵 Active Music Sessions',
        value: activeServers.map(server => 
          `**${server.name}** (${server.memberCount.toLocaleString()} members)
          ${getListenerBar(server.listeners, 10)} \`${server.listeners}\` listeners
          🎧 Channel: ${server.channel}
          🎵 Playing: ${truncate(server.track, 50)}
          ${'-'.repeat(40)}`
        ).join('\n'),
        inline: false
      })
      .setFooter({ 
        text: `Requested by ${message.author.tag} • Refreshed`, 
        iconURL: message.author.displayAvatarURL() 
      })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};

// Helper function to create a visual bar representing listeners
function getListenerBar(listeners, maxSize) {
  const filled = '█';
  const empty = '░';
  const size = Math.min(listeners, maxSize);
  return filled.repeat(size) + empty.repeat(maxSize - size);
}

// Helper function to truncate text
function truncate(str, length) {
  if (!str) return 'Unknown';
  return str.length > length ? str.substring(0, length - 3) + '...' : str;
}
