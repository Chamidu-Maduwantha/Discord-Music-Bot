const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'previous',
  aliases: ['prev', 'back'],
  description: 'Play the previous song in the queue',
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

    if (!player.queue.previous) {
      return message.reply('There is no previous song to play.');
    }

    player.queue.unshift(player.queue.previous);
    player.stop();

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('⏮️ Playing Previous Song')
      .setDescription(`Returning to the previous song: ${player.queue.current.title}`)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    return message.channel.send({ embeds: [embed] });
  },
};

