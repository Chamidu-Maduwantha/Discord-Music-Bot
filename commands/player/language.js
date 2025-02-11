const { EmbedBuilder, PermissionFlagsBits } = require("discord.js")
const { languageManager } = require("../util/language-manager.js")

module.exports = {
  name: "language",
  aliases: ["lang"],
  description: "Set or view the bot language for this server",
  async execute(message, args, client) {
    // Check if user has admin permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(languageManager.getText(message.guild.id, "common.noPermission"))
    }

    const availableLanguages = languageManager.getAvailableLanguages()
    const currentLanguage = languageManager.getServerLanguage(message.guild.id)

    // If no language specified, show current language and available options
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor("#1DB954")
        .setTitle("🌐 Language Settings")
        .setDescription(
          languageManager.getText(message.guild.id, "admin.currentLanguage", {
            language: languageManager.getLanguageName(currentLanguage),
          }),
        )
        .addFields({
          name: languageManager.getText(message.guild.id, "admin.availableLanguages", {
            languages: availableLanguages
              .map((code) => `${code} (${languageManager.getLanguageName(code)})`)
              .join(", "),
          }),
          value: "Usage: !language <code>",
        })

      return message.channel.send({ embeds: [embed] })
    }

    // Get the requested language
    const newLanguage = args[0].toLowerCase()

    // Check if it's a valid language
    if (!availableLanguages.includes(newLanguage)) {
      return message.reply(languageManager.getText(message.guild.id, "common.invalidArgs"))
    }

    // Set the new language
    await languageManager.setServerLanguage(message.guild.id, newLanguage)

    const embed = new EmbedBuilder()
      .setColor("#1DB954")
      .setTitle("🌐 Language Updated")
      .setDescription(languageManager.getText(message.guild.id, "admin.languageSet"))

    return message.channel.send({ embeds: [embed] })
  },
}

