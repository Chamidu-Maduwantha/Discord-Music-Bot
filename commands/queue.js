const { EmbedBuilder } = require('discord.js');


module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Display the current queue.',

    execute(message, args, client) {
      const { commands } = client;
  
      const embed = new EmbedBuilder()
        .setColor('#4CAF50')  // A nice green color
        .setTitle('Song Queue')
        .setDescription(queue.current ? `**Now Playing:** ${queue.current.title}` : 'No song is currently playing.')
        .addFields(
          {
            name: 'Queue',
            value:  queue.length ? queue.map((track, i) => `${i + 1}. ${track.title}`).join('\n'): 'No songs in queue.',
            inline: false
          }
          
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
  
      return message.channel.send({ embeds: [embed] });
    },
  };