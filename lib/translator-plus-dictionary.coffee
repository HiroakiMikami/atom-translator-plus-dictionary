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
    numberOfUsedApis = 0
    emitFinishedIfNeeded = () =>
      numberOfUsedApis -= 1
      if numberOfUsedApis is 0
        @emitter.emit("Finished")

    # TODO Deal with only **one** translation at the same time.
    @emitter.emit("Started")
    for translator in @translators
      if not translator.canBeUsed(from, to) then continue

      numberOfUsedApis += 1
      kind = {
        name: translator.name()
        type: "Translator"
      }
      translator.translate(text, from, to
        ((kind) ->
          (result) ->
            succeeded(kind, result)
            emitFinishedIfNeeded()
        )(kind),
        ((kind) =>
          (error) =>
            @emitter.emit("Failed", {
              kind: kind
              error: error
            })
            failed(kind, error)
            emitFinishedIfNeeded()
        )(kind)
      )
    for dictionary in @dictionaries
      if not dictionary.canBeUsed(from, to) then continue

      numberOfUsedApis += 1
      kind = {
        name: dictionary.name()
        type: "Dictionary"
      }
      dictionary.find(text, from, to
        ((kind) ->
          (result) ->
            succeeded(kind, result)
            emitFinishedIfNeeded()
        )(kind),
        ((kind) =>
          (error) =>
            @emitter.emit("Failed", {
              kind: kind
              error: error
            })
            failed(kind, error)
            emitFinishedIfNeeded()
        )(kind)
      )

    if numberOfUsedApis == 0
      @emitter.emit("Failed", {
        kind: {
          name: "Translator Plus Dictionary"
          type: "General"
        },
        error: {
          message: "There are no APIs that translates from #{from.name} to #{to.name}."
        }
      })

  onStarted: (callback) -> @emitter.on("Started", callback)
  onFinished: (callback) -> @emitter.on("Finished", callback)
  onFailed: (callback) -> @emitter.on("Failed", callback)
