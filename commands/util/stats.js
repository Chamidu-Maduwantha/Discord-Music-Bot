const { EmbedBuilder, version } = require('discord.js');
const { version: eVersion } = require('erela.js');
const os = require('os');

module.exports = {
  name: 'stats',
  aliases: ['botinfo', 'botstats'],
  description: 'Display bot statistics',
  execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('📊 CMusics™ Statistics')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🤖 Bot Name', value: client.user.username, inline: true },
        { name: '🆔 Bot ID', value: client.user.id, inline: true },
        { name: '👑 Bot Owner', value: 'Sp4rky', inline: true },
        { name: '🌐 Servers', value: client.guilds.cache.size.toString(), inline: true },
        { name: '👥 Users', value: client.users.cache.size.toString(), inline: true },
        { name: '📺 Channels', value: client.channels.cache.size.toString(), inline: true },
        { name: '📚 Discord.js', value: `v${version}`, inline: true },
        { name: '🎵 Erela.js', value: `v${eVersion}`, inline: true },
        { name: '🟢 Node.js', value: process.version, inline: true },
        { name: '🖥️ OS', value: `${os.type()} ${os.release()}`, inline: true },
        { name: '💾 Memory', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: '⏳ Uptime', value: formatUptime(client.uptime), inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};

function formatUptime(uptime) {
  const seconds = Math.floor(uptime / 1000) % 60;
  const minutes = Math.floor(uptime / (1000 * 60)) % 60;
  const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

