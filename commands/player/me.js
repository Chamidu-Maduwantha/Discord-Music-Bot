const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'me',
  description: 'Play my special playlist',
  async execute(message, args, client) {
    // Check if the user is a developer
    
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const { channel } = message.member.voice;
    if (!channel) {
      return message.reply('You need to be in a voice channel to use this command.');
    }

    let player = client.manager.get(message.guild.id);
    if (!player) {
      player = client.manager.create({
        guild: message.guild.id,
        voiceChannel: channel.id,
        textChannel: message.channel.id,
      });
    }

    if (player.state !== "CONNECTED") player.connect();

    const mePlaylist = [
      'https://music.youtube.com/playlist?list=PLbX4Lr_j1KGTwPEiPY7pDTxIBSQh9GEVM&si=jzrUaWHTUoQqiNbo',
      'https://music.youtube.com/playlist?list=PLbX4Lr_j1KGS0IWbAxAf_cn2Bt7fcdjMw&si=jr1_hvssNO6sCwiW',
      // Add more playlist links or individual songs here
    ];

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('🎵 my Special Playlist')
      .setDescription('Loading my handpicked songs...');

    const playlistMessage = await message.channel.send({ embeds: [embed] });

    // Iterate over each playlist URL (can be more than one)
    for (const playlistUrl of mePlaylist) {
      const res = await player.search(playlistUrl, message.author);
      if (res.loadType === 'PLAYLIST_LOADED') {
        // If it's a playlist, add all tracks to the queue
        res.tracks.forEach(track => player.queue.add(track));
      } else if (res.loadType === 'TRACK_LOADED' || res.loadType === 'SEARCH_RESULT') {
        // If it's a single track or search result, add the track
        player.queue.add(res.tracks[0]);
      }
    }

    // Play the queue if there are songs and it's not currently playing
    if (!player.playing && !player.paused && player.queue.totalSize > 0) {
      player.play();
    }

    embed.setDescription(`Added ${player.queue.totalSize} songs to the queue from my special playlist!`);
    await playlistMessage.edit({ embeds: [embed] });
  },
};
