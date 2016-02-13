Emitter = null

module.exports =
class TranslatorPlusDictionary
  translators: null
  dictionaries: null
  emitter: null

  constructor: () ->
    # Initialize modules
    Emitter ?= require('atom').Emitter

    # Initialize fields
    @translators = []
    @dictionaries = []
    @emitter = new Emitter

  destroy: ->
    @emitter?.dispose()

  translate: (text, from, to, succeeded, failed) ->
    @emitter.emit("Started")
    for translator in @translators
      if not translator.canBeUsed(from, to) then continue
      kind = {
        name: translator.name()
        type: "Translator"
      }
      translator.translate(text, from, to
        ((kind) ->
          (result) ->
            succeeded(kind, result)
        )(kind),
        ((kind) =>
          (error) =>
            @emitter.emit("Failed", {
              kind: kind
              error: error
            })
            failed(kind, error)
        )(kind)
      )
    for dictionary in @dictionaries
      if not dictionary.canBeUsed(from, to) then continue
      kind = {
        name: dictionary.name()
        type: "Dictionary"
      }
      dictionary.find(text, from, to
        ((kind) ->
          (result) ->
            succeeded(kind, result)
        )(kind),
        ((kind) =>
          (error) =>
            @emitter.emit("Failed", {
              kind: kind
              error: error
            })
            failed(kind, error)
        )(kind)
      )
    @emitter.emit("Finished")

  onStarted: (callback) -> @emitter.on("Started", callback)
  onFinished: (callback) -> @emitter.on("Finished", callback)
  onFailed: (callback) -> @emitter.on("Failed", callback)
