module.exports = {
    name: 'skip',
    aliases: ['sk'],
    description: 'Skip the current song.',
    execute(message, args, client) {
      const player = client.manager.get(message.guild.id);
      if (!player) return message.reply('No song is currently playing.');
      player.stop();
      
    },
  };