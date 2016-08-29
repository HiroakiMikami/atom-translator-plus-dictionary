'use babel'

export default class Translator {
  name() { return "" }
  canBeUsed(from, to) { return false }
  translate(text, from, to) {
    return new Promise((resolve, reject) => {
      reject({
        message: "translate function is not implemented."
      })
    })
  }
}
