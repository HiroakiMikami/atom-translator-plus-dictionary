path = null
fs = null

module.exports =
class ExternalApis
  @translators: null
  @dictionaries: null

  @load: (translatorPlusDictionary) ->
    # Initialize modules
    path ?= require 'path'
    fs ?= require 'fs'

    # Load external APIs
    if not ExternalApis.translators?
      translatorPath = path.resolve(atom.getConfigDirPath(), "translators.coffee")
      if fs.existsSync(translatorPath)
        ExternalApis.translators = require("#{atom.getConfigDirPath()}/translators")
      else
        ExternalApis.translators = []

    if not ExternalApis.dictionaries?
      dictionaryPath = path.resolve(atom.getConfigDirPath(), "dictionaries.coffee")
      if fs.existsSync(dictionaryPath)
        ExternalApis.dictionaries = require("#{atom.getConfigDirPath()}/dictionaries")
      else
        ExternalApis.dictionaries = []

    Array.prototype.push.apply(
      translatorPlusDictionary.translators,
      ExternalApis.translators
    )
    Array.prototype.push.apply(
      translatorPlusDictionary.dictionaries,
      ExternalApis.dictionaries
    )
