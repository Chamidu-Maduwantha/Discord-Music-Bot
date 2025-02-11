const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Display all available commands.',
  execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#4CAF50')
      .setTitle('🎵 CMusics™ Bot Commands')
      .setDescription('Here are all the available commands:')
      .addFields(
        {
          name: '🎧 Playback Controls',
          value: '`play (p)`, `pause`, `resume`, `skip (s)`, `previous (prev, back)`, `stop`, `seek`, `volume`, `bassboost (bb)`',
          inline: false
        },
        {
          name: '📊 Queue Management',
          value: '`queue (q)`, `clear`, `shuffle`, `remove`',
          inline: false
        },
        {
          name: '📌 Now Playing',
          value: '`nowplaying (np, current)`',
          inline: false
        },
        {
          name: '🔧 Utility',
          value: '`ping`, `stats`, `about`',
          inline: false
        }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};

