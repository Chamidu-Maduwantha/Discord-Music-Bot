const { EmbedBuilder, version } = require('discord.js');

module.exports = {
  name: 'about',
  description: 'Display information about the CMusics™ bot',
  execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('About CMusics™')
      .setDescription('Your ultimate music companion for Discord!')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '🤖 Bot Name', value: 'CMusics™', inline: true },
        { name: '✅ Verified', value: 'Yes', inline: true },
        { name: '🔢 Version', value: 'v4.0.0', inline: true },
        { name: '📚 Library', value: `Discord.js v${version}`, inline: true },
        { name: '🎵 Audio', value: 'Lavalink', inline: true },
        { name: '👑 Developer', value: 'Sp4rky', inline: true },
        { name: '🌐 A Work By', value: 'Ignix Solutions', inline: true },
        { name: '🔗 Invite', value: '[Add to Server](https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot)', inline: true },
       
        { name: '📖 Server' , value : client.guilds.cache.size.toString(), inline:true }
        
      )
      .setFooter({ text: 'CMusics™ - Elevating your Discord music experience since 2022' });

    return message.channel.send({ embeds: [embed] });
  },
};

