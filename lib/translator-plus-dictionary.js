'use babel'

let Emitter = null

let isInitialized = false
function initialize() {
  if (isInitialized) return

  Emitter = require('atom').Emitter

  isInitialized = true
}

export default class TranslatorPlusDictionary {
  constructor() {
    initialize()

    // Initialize fields
    this.translators = []
    this.dictionaries = []
    this.emitter = new Emitter()
  }
  destroy() {
    this.emitter.dispose()
  }
  translate(text, from, to, succeeded, failed) {
    let numberOfUsedApis = 0
    const emitFinishedIfNeeded = () => {
      numberOfUsedApis -= 1
      if (numberOfUsedApis === 0) {
        this.emitter.emit("Finished")
      }
    }

    // TODO Deal with only **one** translation at the same time.
    this.emitter.emit("Started")
    for (const translator of this.translators) {
      if (!translator.canBeUsed(from, to)) continue

      numberOfUsedApis += 1
      const kind = {
        name: translator.name(),
        type: "Translator"
      }
      translator.translate(text, from, to).then(
        ((kind) => {
          return (result) => {
            if (result) {
              succeeded(kind, result)
            }
            emitFinishedIfNeeded()
          }
        })(kind),
        ((kind) => {
          return (error) => {
            this.emitter.emit("Failed", {
              kind: kind,
              error: error
            })
            failed(kind, error)
            emitFinishedIfNeeded()
          }
        })(kind)
      )
    }
    for (const dictionary of this.dictionaries) {
      if (!dictionary.canBeUsed(from, to)) continue

      numberOfUsedApis += 1
      const kind = {
        name: dictionary.name(),
        type: "Dictionary"
      }
      dictionary.find(text, from, to).then(
        ((kind) => {
          return (result) => {
            if (result) {
              succeeded(kind, result)
            }
            emitFinishedIfNeeded()
          }
        })(kind),
        ((kind) => {
          return (error) => {
            this.emitter.emit("Failed", {
              kind: kind,
              error: error
            })
            failed(kind, error)
            emitFinishedIfNeeded()
          }
        })(kind)
      )
    }

    if (numberOfUsedApis === 0) {
      this.emitter.emit("Failed", {
        kind: {
          name: "Translator Plus Dictionary",
          type: "General"
        },
        error: {
          message: `There are no APIs that translates from ${from.name} to ${to.name}.`
        }
      })
    }
  }
  onStarted(callback) {
    return this.emitter.on("Started", callback)
  }
  onFinished(callback) {
    return this.emitter.on("Finished", callback)
  }
  onFailed(callback) {
    return this.emitter.on("Failed", callback)
  }
}
