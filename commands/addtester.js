const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
  name: 'addtester',
  aliases: ['test'],
  description: 'Add a temporary tester with developer privileges (Developer only)',
  async execute(message, args, client) {
    // Check if the user has developer privileges
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    if (args.length < 2) {
      return message.reply('Please provide a user mention and duration (e.g., !addtester @user 1d)');
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a valid user.');
    }

    const duration = ms(args[1]);
    if (!duration) {
      return message.reply('Please provide a valid duration (e.g., 1h, 1d, 7d)');
    }

    client.temporaryTesters.set(user.id, setTimeout(() => {
      client.temporaryTesters.delete(user.id);
      const expiredEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🚫 CMusics™ Tester Status Expired')
        .setDescription('Your temporary tester status for CMusics™ has expired.')
        .addFields(
          { name: 'Duration', value: ms(duration, { long: true }), inline: true }
        )
        .setFooter({ text: 'Thank you for your help in testing CMusics™!' })
        .setTimestamp();
      user.send({ embeds: [expiredEmbed] }).catch(() => {});
    }, duration));

    const addedEmbed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🧪 CMusics™ Temporary Tester Added')
      .setDescription(`${user} has been added as a temporary tester for CMusics™ for ${ms(duration, { long: true })}.`)
      .setFooter({ text: `Added by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [addedEmbed] });

    const testerInfoEmbed = new EmbedBuilder()
      .setColor('#4CAF50')
      .setTitle('🎉 Welcome, CMusics™ Temporary Tester!')
      .setDescription(`You have been granted temporary tester status for CMusics™ for ${ms(duration, { long: true })}.`)
      .addFields(
        { name: 'Duration', value: ms(duration, { long: true }), inline: true },
        { name: 'Privileges', value: 'You can now use developer commands and access CMusics™ during maintenance mode.' }
      )
      .setFooter({ text: 'Thank you for helping test CMusics™!' })
      .setTimestamp();

    user.send({ embeds: [testerInfoEmbed] }).catch(() => {});
  },
};

