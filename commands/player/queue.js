const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'queue',
  aliases: ['q'],
  description: 'Display the current music queue',
  execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    if (!player || !player.queue.current) {
      return message.reply('There is no music playing in this server.');
    }

    const queue = player.queue;
    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎵 Music Queue')
      .setThumbnail(message.guild.iconURL({ dynamic: true, size: 256 }))
      .setDescription(`**Now Playing:**\n[${queue.current.title}](${queue.current.uri}) [${formatDuration(queue.current.duration)}]`)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    // Get the next 10 songs in the queue
    const tracks = queue.slice(0, 10).map((track, i) => {
      return `${i + 1}. [${track.title}](${track.uri}) [${formatDuration(track.duration)}]`;
    });

    if (tracks.length) {
      embed.addFields({ name: 'Up Next:', value: tracks.join('\n') });
    }

    if (queue.length > 10) {
      embed.addFields({ name: 'And more...', value: `${queue.length - 10} more track(s) in queue` });
    }

    return message.channel.send({ embeds: [embed] });
  },
};

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

