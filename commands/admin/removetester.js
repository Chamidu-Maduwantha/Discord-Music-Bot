const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'removetester',
  aliases: ['deltester'],
  description: 'Remove a temporary tester (Developer only)',
  async execute(message, args, client) {
    // Check if the user has developer privileges
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    if (args.length < 1) {
      return message.reply('Please provide a user mention or ID to remove as a tester.');
    }

    let userId;
    if (message.mentions.users.size > 0) {
      userId = message.mentions.users.first().id;
    } else {
      userId = args[0];
    }

    if (!client.temporaryTesters.has(userId)) {
      return message.reply('This user is not a temporary tester for CMusics™.');
    }

    clearTimeout(client.temporaryTesters.get(userId));
    client.temporaryTesters.delete(userId);

    const user = await client.users.fetch(userId);
    const removedEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🧪 CMusics™ Temporary Tester Removed')
      .setDescription(`${user.tag} (ID: ${userId}) has been removed as a temporary tester for CMusics™.`)
      .setFooter({ text: `Removed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [removedEmbed] });

    const testerRemovedEmbed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🚫 CMusics™ Tester Status Revoked')
      .setDescription('Your temporary tester status for CMusics™ has been revoked.')
      .addFields(
        { name: 'Reason', value: 'Manually removed by an administrator', inline: true }
      )
      .setFooter({ text: 'Thank you for your help in testing CMusics™!' })
      .setTimestamp();

    user.send({ embeds: [testerRemovedEmbed] }).catch(() => {});
  },
};

