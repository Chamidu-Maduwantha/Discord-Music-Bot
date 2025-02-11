module.exports = {
    name: 'volume',
    aliases: ['vol'],
    description: 'Change the volume of the current song.',
    execute(message, args, client) {
      const player = client.manager.get(message.guild.id);
      if (!player) return message.reply('No song is currently playing.');
  
      const volume = Number(args[0]);
      if (!volume || isNaN(volume) || volume < 0 || volume > 100) {
        return message.reply('Please provide a valid number between 0 and 100.');
      }
  
      player.setVolume(volume);
      message.reply(`Set the volume to ${volume}.`);
    },
  };