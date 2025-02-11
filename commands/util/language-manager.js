const fs = require("fs").promises
const path = require("path")

class LanguageManager {
  constructor() {
    this.serverLanguages = new Map()
    this.translations = {
      en: require("../../languages/en.js"),
      ja: require("../../languages/ja.js"),
    }
    this.dataPath = path.join(process.cwd(), "data", "server-languages.json")
    this.loadLanguages()
  }

  async loadLanguages() {
    try {
      const data = await fs.readFile(this.dataPath, "utf-8")
      const languages = JSON.parse(data)
      Object.entries(languages).forEach(([serverId, lang]) => {
        this.serverLanguages.set(serverId, lang)
      })
    } catch (error) {
      // If file doesn't exist, create directory and empty file
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true })
      await fs.writeFile(this.dataPath, "{}")
    }
  }

  async saveLanguages() {
    const data = Object.fromEntries(this.serverLanguages)
    await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2))
  }

  getServerLanguage(serverId) {
    return this.serverLanguages.get(serverId) || "en"
  }

  async setServerLanguage(serverId, language) {
    this.serverLanguages.set(serverId, language)
    await this.saveLanguages()
  }

  getText(serverId, key, replacements = {}) {
    const language = this.getServerLanguage(serverId)
    const keys = key.split(".")
    let text = keys.reduce((obj, key) => obj?.[key], this.translations[language])

    if (!text) {
      // Fallback to English if translation is missing
      text = keys.reduce((obj, key) => obj?.[key], this.translations["en"])
    }

    if (!text) return key

    // Replace placeholders
    return text.replace(/\{(\w+)\}/g, (_, key) => replacements[key]?.toString() || `{${key}}`)
  }

  getAvailableLanguages() {
    return Object.keys(this.translations)
  }

  getLanguageName(code) {
    const names = {
      en: "English",
      ja: "日本語",
    }
    return names[code]
  }
}

// Create and export a single instance
const languageManager = new LanguageManager()
module.exports = { languageManager }

