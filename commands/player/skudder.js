const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'skudder',
  description: 'Play Skudder\'s special playlist',
  async execute(message, args, client) {
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

    const skudderPlaylist = [
      'https://music.youtube.com/playlist?list=LRYRG_ZUrT9UCZYT9XvIxh1wuP3m2TG2_SWpv&si=ZMWMQ_Kz-2s0iL7e',
      // Add more playlist links or individual songs here
    ];

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('🎵 Skudder\'s Special Playlist')
      .setDescription('Loading Skudder\'s handpicked songs...');

    const playlistMessage = await message.channel.send({ embeds: [embed] });

    // Iterate over each playlist URL (can be more than one)
    for (const playlistUrl of skudderPlaylist) {
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

    embed.setDescription(`Added ${player.queue.totalSize} songs to the queue from Skudder's special playlist!`);
    await playlistMessage.edit({ embeds: [embed] });

    // Listen for the 'trackEnd' event to handle when a track ends
    
  },
};
