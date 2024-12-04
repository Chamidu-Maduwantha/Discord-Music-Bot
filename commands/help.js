const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['h'],
  description: 'Display all available commands.',
  execute(message, args, client) {
    const { commands } = client;

    const embed = new EmbedBuilder()
      .setColor('#4CAF50')  // A nice green color
      .setTitle('🎵 CMusic Commands')
      .setDescription('Here are all the available commands:')
      .addFields(
        {
          name: '🎧 Playback Controls',
          value: '`play`, `pause`, `resume`, `skip`, `stop`, `seek`, `volume`',
          inline: false
        },
        {
          name: '📊 Queue Management',
          value: '`queue`, `clear`, `shuffle`, `remove`',
          inline: false
        },
        {
          name: '📌 Now Playing',
          value: '`nowplaying`',
          inline: false
        },
        {
          name: '🔧 Utility',
          value: '`ping`, `stats`, `about`',
          inline: false
        }
        
      )
      .setFooter({ text: `Cmusics™`, iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};

