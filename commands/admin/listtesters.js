const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
  name: 'listtesters',
  aliases: ['listtest'],
  description: 'List all current temporary testers (Developer only)',
  async execute(message, args, client) {
    // Check if the user has developer privileges
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🧪 Current Temporary Testers')
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    if (client.temporaryTesters.size === 0) {
      embed.setDescription('There are currently no temporary testers.');
    } else {
      const testerList = [];
      for (const [userId, timeout] of client.temporaryTesters.entries()) {
        const user = await client.users.fetch(userId);
        const remainingTime = timeout._idleTimeout - (Date.now() - timeout._idleStart);
        testerList.push(`${user.tag} (ID: ${userId}) - Expires in ${ms(remainingTime, { long: true })}`);
      }
      embed.setDescription(testerList.join('\n'));
    }

    return message.channel.send({ embeds: [embed] });
  },
};

