const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'shutdown',
  aliases: ['exit'],
  description: 'Shut down the bot (Developer only)',
  async execute(message, args, client) {
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🛑 CMusics™ Shutting Down')
      .setDescription('The bot is now shutting down. Goodbye!')
      .setFooter({ text: `Shutdown initiated by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    console.log('Shutting down...');
    
    try {
      // Destroy all players
      client.manager.players.forEach((player) => {
        player.destroy();
      });

      // Disconnect the manager
      await client.manager.destroyNode();

      // Destroy the client
      await client.destroy();

      // Exit the process
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  },
};

