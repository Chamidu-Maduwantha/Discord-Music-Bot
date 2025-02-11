module.exports = {
    name: 'resume',
    aliases: ['rs'],
    description: 'Resume the current song.',
    execute(message, args, client) {
      const player = client.manager.get(message.guild.id);
      if (!player) return message.reply('No song is currently playing.');
      player.pause(false);
      message.reply('Resumed the current song.');
    },
  };