const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'servers',
  aliases: ['guilds'],
  description: 'Shows the servers the bot is in (Developer only)',
  execute(message, args, client) {
    // Check if the user has developer privileges
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const serverList = client.guilds.cache.map(guild => {
      return `${guild.name} (ID: ${guild.id}) - ${guild.memberCount} members`;
    });

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle(`Bot Servers (Total: ${client.guilds.cache.size})`)
      .setDescription(serverList.join('\n').slice(0, 4096)) // Discord has a 4096 character limit for embed descriptions
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};

