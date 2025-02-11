const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'bassboost',
  aliases: ['bb'],
  description: 'Toggle bassboost filter',
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

    const bassboost = !player.get('bassboost');
    player.set('bassboost', bassboost);
    player.setEQ(bassboost ? [
      { band: 0, gain: 0.6 },
      { band: 1, gain: 0.7 },
      { band: 2, gain: 0.8 },
      { band: 3, gain: 0.55 },
    ] : []);

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎛️ Bassboost')
      .setDescription(`Bassboost has been ${bassboost ? 'enabled' : 'disabled'}.`)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    return message.channel.send({ embeds: [embed] });
  },
};

