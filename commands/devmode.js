module.exports = {
    name: 'devmode',
    aliases: ['dev'],
    description: 'Toggle developer mode.',
    execute(message, args, client) {
      if (!client.config.devs.includes(message.author.id)) {
        return message.reply('You do not have permission to use this command.');
      }
  
      client.devMode = !client.devMode;
      message.reply(`Developer mode is now ${client.devMode ? 'ON' : 'OFF'}.`);
    },
  };