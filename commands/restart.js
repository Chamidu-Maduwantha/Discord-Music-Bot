const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'restart',
  aliases: ['rs'],
  description: 'Restarts the bot (Developer only)',
  async execute(message, args, client) {
    // Check if the user has developer privileges
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🔄 Bot Restarting')
      .setDescription('The bot is now restarting. Please wait...')
      .setFooter({ text: `Restart initiated by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    // Perform cleanup operations
    await client.manager.destroyAll();
    await client.destroy();

    // Restart the bot
    process.exit(1); // This will exit the process, and if you have a proper restart mechanism (like PM2), it will restart the bot
  },
};

