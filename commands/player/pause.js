module.exports = {
    name: 'pause',
    aliases: ['ps'],
    description: 'Pause the current song.',
    execute(message, args, client) {
      const player = client.manager.get(message.guild.id);
      if (!player) return message.reply('No song is currently playing.');
      player.pause(true);
      message.reply('Paused the current song.');
    },
  };