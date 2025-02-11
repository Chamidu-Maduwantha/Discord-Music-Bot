const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'seek',
  aliases: ['jump'],
  description: 'Seek to a specific position in the current song',
  async execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    if (!player) {
      return message.reply('There is no music playing in this server.');
    }

    const { channel } = message.member.voice;
    if (!channel) {
      return message.reply('You need to be in a voice channel to use this command.');
    }

    if (channel.id !== player.voiceChannel) {
      return message.reply('You need to be in the same voice channel as the bot to use this command.');
    }

    if (!args[0]) {
      return message.reply('Please provide a position to seek to (in seconds).');
    }

    const position = Number(args[0]) * 1000; // Convert to milliseconds
    if (isNaN(position)) {
      return message.reply('Please provide a valid number of seconds.');
    }

    if (position < 0 || position > player.queue.current.duration) {
      return message.reply('Please provide a valid position within the song duration.');
    }

    player.seek(position);

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('⏩ Seeked')
      .setDescription(`Seeked to ${formatTime(position)} in the current song.`)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    return message.channel.send({ embeds: [embed] });
  },
};

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

