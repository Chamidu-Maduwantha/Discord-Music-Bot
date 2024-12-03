const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'nowplaying',
  aliases: ['np'],
  description: 'Display information about the current song.',
  async execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    
    if (!player || !player.queue.current) {
      return message.reply('No song is currently playing.');
    }

    const track = player.queue.current;
    
    // Calculate the progress bar
    const duration = track.duration;
    const current = player.position;
    const size = 15;
    const line = '─';
    const slider = '🔘';
    
    let progress = Math.floor((size * current) / duration);
    if (progress > size) progress = size;
    
    const progressBar = line.repeat(progress) + 
                       slider + 
                       line.repeat(size - progress);

    // Format timestamps
    const formatTime = (ms) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const embed = new EmbedBuilder()
      .setColor('#FF69B4') // Pink color for the accent
      .setTitle('Currently playing')
      .setDescription(`[${track.title}](${track.uri})`)
      .addFields(
        { 
          name: 'Requested by', 
          value: `<@${track.requester.id}>`,
          inline: true 
        },
        {
          name: 'Duration',
          value: `\`\`\`${progressBar}\`\`\`${formatTime(current)} / ${formatTime(duration)}`,
          inline: false
        }
      );

    // Add thumbnail if available
    if (track.thumbnail) {
      embed.setThumbnail(track.thumbnail);
    }

    return message.channel.send({ embeds: [embed] });
  },
};

