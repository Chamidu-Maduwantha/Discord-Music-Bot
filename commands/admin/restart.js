const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'restart',
  aliases: ['reboot'],
  description: 'Restart the bot and reconnect to Lavalink (Developer only)',
  async execute(message, args, client) {
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🔄 CMusics™ Restarting')
      .setDescription('The bot is now restarting and reconnecting to Lavalink. Please wait...')
      .setFooter({ text: `Restart initiated by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    console.log('Restarting and reconnecting to Lavalink...');
    
    try {
      // Destroy all players
      client.manager.players.forEach((player) => {
        player.destroy();
      });

      // Disconnect the manager
      await client.manager.destroyNode();

      // Reinitialize the manager
      await client.manager.init(client.user.id);

      // Log the successful restart
      console.log('Successfully restarted and reconnected to Lavalink.');
      client.channels.cache.get(client.config.logChannel)?.send('Bot successfully restarted and reconnected to Lavalink.');

      // Send a confirmation message
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ CMusics™ Restarted')
        .setDescription('The bot has successfully restarted and reconnected to Lavalink.')
        .setTimestamp();

      await message.channel.send({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error('Error during restart:', error);
      client.channels.cache.get(client.config.logChannel)?.send(`Error during restart: ${error.message}`);
      await message.channel.send('An error occurred during the restart process. Please check the logs.');
    }
  },
};

