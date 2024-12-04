const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'play',
  aliases: ['p', 'start'],
  description: 'Play a song or add it to the queue',
  async execute(message, args, client) {
    const { channel } = message.member.voice;

    if (!channel) {
      return message.reply('You need to join a voice channel first!');
    }

    if (!args.length) {
      return message.reply('Please provide a song name or URL!');
    }

    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: channel.id,
      textChannel: message.channel.id,
    });

    if (player.state !== "CONNECTED") player.connect();

    const search = args.join(' ');
    let res;

    try {
      res = await player.search(search, message.author);
      if (res.loadType === 'LOAD_FAILED') {
        if (!player.queue.current) player.destroy();
        throw res.exception;
      }
    } catch (err) {
      return message.reply(`There was an error while searching: ${err.message}`);
    }

    const embed = new EmbedBuilder().setColor('#3498db');

    switch (res.loadType) {
      case 'NO_MATCHES':
        if (!player.queue.current) player.destroy();
        return message.reply('No results found.');
      case 'TRACK_LOADED':
        player.queue.add(res.tracks[0]);
        embed
          .setTitle('🎵 Added to queue')
          .setDescription(`[${res.tracks[0].title}](${res.tracks[0].uri})`)
          .setThumbnail(res.tracks[0].thumbnail || null)
          .addFields(
            { name: 'Duration', value: formatDuration(res.tracks[0].duration), inline: true },
            { name: 'Requested by', value: `<@${message.author.id}>`, inline: true }
          )
          .setFooter({ text: `Cmusics™`, iconURL: client.user.displayAvatarURL() });
        if (!player.playing && !player.paused && !player.queue.size) player.play();
        return message.channel.send({ embeds: [embed] });
      case 'PLAYLIST_LOADED':
        player.queue.add(res.tracks);
        embed
          .setTitle('🎵 Playlist added to queue')
          .setDescription(`**${res.playlist.name}** - ${res.tracks.length} tracks`)
          .addFields(
            { name: 'Duration', value: formatDuration(res.playlist.duration), inline: true },
            { name: 'Requested by', value: `<@${message.author.id}>`, inline: true }
          )
          .setFooter({ text: `Cmusics™`, iconURL: client.user.displayAvatarURL() });
        if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();
        return message.channel.send({ embeds: [embed] });
      case 'SEARCH_RESULT':
        const track = res.tracks[0];
        player.queue.add(track);
        embed
          .setTitle('🎵 Added to queue')
          .setDescription(`[${track.title}](${track.uri})`)
          .setThumbnail(track.thumbnail || null)
          .addFields(
            { name: 'Duration', value: formatDuration(track.duration), inline: true },
            { name: 'Requested by', value: `<@${message.author.id}>`, inline: true }
          )
          .setFooter({ text: `Cmusics™`, iconURL: client.user.displayAvatarURL() });
        if (!player.playing && !player.paused && !player.queue.size) player.play();
        return message.channel.send({ embeds: [embed] });
    }
  },
};

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}
