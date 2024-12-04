const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'restart',
  aliases: ['reboot'],
  description: 'Restart the bot (Developer only)',
  async execute(message, args, client) {
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🔄 CMusics™ Restarting')
      .setDescription('The bot is now restarting. Please wait...')
      .setFooter({ text: `Restart initiated by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    console.log('Restarting...');
    
    // Destroy all players
    client.manager.players.forEach((player) => {
      player.destroy();
    });

    // Disconnect the manager
    client.manager.removeAllListeners();
    await client.manager.disconnect();

    await client.destroy();

    // Use process.exit(1) to indicate an error, which should trigger a restart if you're using a process manager
    process.exit(1);
  },
};

