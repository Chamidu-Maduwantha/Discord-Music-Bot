const { EmbedBuilder } = require("discord.js")
const { languageManager } = require("../util/language-manager.js")

module.exports = {
  name: "play",
  aliases: ["p"],
  description: "Play a song or add it to the queue",
  async execute(message, args, client) {
    const guildId = message.guild.id

    if (!args.length) {
      return message.reply(languageManager.getText(guildId, "common.invalidArgs"))
    }

    if (!message.member.voice.channel) {
      return message.reply(languageManager.getText(guildId, "music.notInVoice"))
    }

    try {
      const res = await client.manager.search(args.join(" "), message.author)

      if (!res || !res.tracks || !res.tracks.length) {
        return message.reply(languageManager.getText(guildId, "music.noResults"))
      }

      const player = client.manager.create({
        guild: message.guild.id,
        voiceChannel: message.member.voice.channel.id,
        textChannel: message.channel.id,
      })

      player.connect()

      if (res.type === "PLAYLIST") {
        const playlist = res.tracks
        player.queue.add(playlist)
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#1DB954")
              .setTitle("📑 " + languageManager.getText(guildId, "music.playlistAdded"))
              .setDescription(
                languageManager.getText(guildId, "music.addedToQueue", {
                  count: playlist.length,
                }),
              )
              .setFooter({
                text: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL(),
              }),
          ],
        })
      } else {
        const track = res.tracks[0]
        player.queue.add(track)
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#1DB954")
              .setTitle("🎵 " + languageManager.getText(guildId, "music.trackAdded"))
              .setDescription(`[${track.title}](${track.uri})`)
              .addFields({
                name: "Duration",
                value: formatDuration(track.duration),
                inline: true,
              })
              .setThumbnail(track.thumbnail || null)
              .setFooter({
                text: `${message.author.tag}`,
                iconURL: message.author.displayAvatarURL(),
              }),
          ],
        })
      }

      if (!player.playing && !player.paused && !player.queue.size) {
        player.play()
      }
    } catch (error) {
      console.error("Error in play command:", error)
      return message.reply(languageManager.getText(guildId, "common.error"))
    }
  },
}

function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)
  const hours = Math.floor(duration / (1000 * 60 * 60))

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`
}

