module.exports = {
    name: 'ping',
    aliases: [],
    description: 'Check the bot\'s latency.',
    execute(message, args, client) {
      message.reply(`Pong! Latency is ${client.ws.ping}ms.`);
    },
  };