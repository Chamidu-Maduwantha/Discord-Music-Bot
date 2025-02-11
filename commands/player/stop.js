const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'stop',
  aliases: ['st', 'disconnect'],
  description: 'Stops the music and clears the queue',
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

    player.destroy();

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🛑 Playback Stopped')
      .setDescription('The music has been stopped and the queue has been cleared.')
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    return message.channel.send({ embeds: [embed] });
  },
};

