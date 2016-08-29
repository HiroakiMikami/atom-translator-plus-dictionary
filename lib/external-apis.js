'use babel'

let path = null
let fs = null

let isInitialized = false
function initialize() {
  if (isInitialized) return

  path = require('path')
  fs = require('fs')

  isInitialized = true
}

export default class ExternalApis {
  static load(translatorPlusDictionary) {
    // Load external APIs
    if (!ExternalApis.translators) {
      try {
        ExternalApis.translators = require(`${atom.getConfigDirPath()}/translators`)
      } catch (e) {
        ExternalApis.translators = []
      }
    }

    if (!ExternalApis.dictionaries) {
      try {
        ExternalApis.dictionaries = require(`${atom.getConfigDirPath()}/dictionaries`)
      } catch (e) {
        ExternalApis.dictionaries = []
      }
    }

    // Add external APIs into TranslatorPlusDictionary
    Array.prototype.push.apply(
      translatorPlusDictionary.translators,
      ExternalApis.translators
    )
    Array.prototype.push.apply(
      translatorPlusDictionary.dictionaries,
      ExternalApis.dictionaries
    )
  }
}
