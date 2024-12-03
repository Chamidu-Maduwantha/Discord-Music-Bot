const { version } = require('discord.js');
const { version: eVersion } = require('erela.js');

module.exports = {
  name: 'stats',
  aliases: ['statistics', 'info'],
  description: 'Display bot statistics.',
  execute(message, args, client) {
    const embed = new MessageEmbed()
      .setTitle('Bot Statistics')
      .addField('Discord.js Version', version)
      .addField('Erela.js Version', eVersion)
      .addField('Uptime', formatTime(client.uptime))
      .addField('Memory Usage', `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`)
      .addField('Servers', client.guilds.cache.size.toString())
      .addField('Channels', client.channels.cache.size.toString())
      .addField('Users', client.users.cache.size.toString());

    message.channel.send({ embeds: [embed] });
  },
};

function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}