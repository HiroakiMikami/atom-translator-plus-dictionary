module.exports = Translators = [
  {
    name: () => { return "The name of Translator" },
    canBeUsed: (from, to) => {
      /*
      Return true when this API can translate texts from ${from} to ${to}
      ${from} and ${to} are instances of Language class.
      */
      return true
    },
    translate: (text, from, to) => {
      // Translate ${text} from ${from} to ${to}
      return new Promise((resolve, reject) => {
        try {
          resolve("<b>Result</b>")
        } catch (error) {
          reject("error")
        }
      })
    }
  }
]
