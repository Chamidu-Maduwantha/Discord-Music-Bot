const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'servers',
  aliases: ['guilds'],
  description: 'Shows the servers the bot is in (Developer only)',
  execute(message, args, client) {
    // Check if the user has developer privileges
    if (!client.config.devs.includes(message.author.id)) {
      return message.reply('You do not have permission to use this command.');
    }

    const serverList = client.guilds.cache.map(async (guild) => {
      try {
        const owner = await guild.fetchOwner();
        const ownerName = owner ? owner.user.username : 'Unknown';
        const joinDate = guild.joinedAt.toDateString(); // Format the join date

        // Try to create an invite link (if bot has permissions)
        let inviteLink = 'No invite available';
        try {
          const defaultChannel = guild.systemChannel || guild.channels.cache.find(channel => channel.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE'));
          
          // Ensure the channel exists before trying to create an invite
          if (defaultChannel) {
            try {
              const invite = await defaultChannel.createInvite({ maxAge: 0 }); // Permanent invite link
              inviteLink = invite.url;
            } catch (inviteError) {
              // Log error silently, but proceed
              console.warn(`Error creating invite for guild ${guild.name}:`, inviteError);
            }
          }
        } catch (error) {
          // Log error silently, but continue with no invite
          console.warn(`Error processing invite for guild ${guild.name}:`, error);
        }

        return {
          name: `**\`\`${guild.name}\`\`**`, // Highlight server name and make it bold
          value: `**ID**: ${guild.id}\n**Members**: ${guild.memberCount}\n**Owner**: ${ownerName}\n**Joined**: ${joinDate}\n**Invite**: [Click here](${inviteLink})`,
          inline: true
        };
      } catch (error) {
        // Log error silently, and handle fallback
        console.warn(`Error fetching owner for guild ${guild.name}:`, error);
        return {
          name: `**\`\`${guild.name}\`\`**`, // Highlight server name and make it bold
          value: `**ID**: ${guild.id}\n**Members**: ${guild.memberCount}\n**Owner**: Unknown\n**Joined**: ${guild.joinedAt.toDateString()}\n**Invite**: No invite available`,
          inline: true
        };
      }
    });

    // Wait for all the async operations to complete
    Promise.all(serverList).then((serverDetails) => {
      // Split the server list into chunks of 25
      const chunkedServerDetails = [];
      while (serverDetails.length) {
        chunkedServerDetails.push(serverDetails.splice(0, 25));
      }

      // Send multiple embeds if necessary
      chunkedServerDetails.forEach((chunk, index) => {
        const embed = new EmbedBuilder()
          .setColor('#1DB954')
          .setTitle(`Bot Servers (Page ${index + 1} of ${chunkedServerDetails.length})`)
          .setDescription('Here are the servers the bot is currently in:')
          .addFields(...chunk) // Add the fields dynamically
          .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();

        message.channel.send({ embeds: [embed] });
      });
    });
  },
};
