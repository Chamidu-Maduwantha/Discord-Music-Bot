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
    
    // Destroy all players
    client.manager.players.forEach((player) => {
      player.destroy();
    });

    // Disconnect from Lavalink nodes
    client.manager.nodes.forEach((node) => {
      node.disconnect();
    });

    await client.destroy();
    process.exit(0);
  },
};

