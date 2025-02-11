const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'current'],
  description: 'Show information about the currently playing song',
  execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    if (!player || !player.queue.current) {
      return message.reply('There is no song currently playing.');
    }

    const track = player.queue.current;
    const position = player.position;
    const duration = track.duration;
    const progress = Math.floor((position / duration) * 30);

    const progressBar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(30 - progress);

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('🎵 Now Playing')
      .setDescription(`[${track.title}](${track.uri})`)
      .setThumbnail(track.thumbnail || null)
      .addFields(
        { name: 'Duration', value: `${formatDuration(position)} / ${formatDuration(duration)}`, inline: true },
        { name: 'Requested by', value: `<@${track.requester.id}>`, inline: true },
        { name: 'Progress', value: progressBar }
      );

    message.channel.send({ embeds: [embed] });
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

