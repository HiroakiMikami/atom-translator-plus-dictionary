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
  constructor(pathes) {
    let translatorsPath = `${atom.getConfigDirPath()}/translators`
    let dictionariesPath = `${atom.getConfigDirPath()}/dictionaries`
    if (pathes) {
      if (pathes.translatorsPath) {
        translatorsPath = pathes.translatorsPath
      }
      if (pathes.dictionariesPath) {
        translatorsPath = pathes.dictionariesPath
      }
    }

    try {
      this.translators = require(translatorsPath)
    } catch (e) {
      this.translators = []
    }
    try {
      this.dictionaries = require(dictionariesPath)
    } catch (e) {
      this.dictionaries = []
    }
  }
  load(translatorPlusDictionary) {
    // Add external APIs into TranslatorPlusDictionary
    Array.prototype.push.apply(
      translatorPlusDictionary.translators,
      this.translators
    )
    Array.prototype.push.apply(
      translatorPlusDictionary.dictionaries,
      this.dictionaries
    )
  }
}
