'use babel'

export default class Translator {
  name() { return "" }
  canBeUsed(from, to) { return false }
  translate(text, from, to, succeeded, failed) {
    failed({
      message: "translate function is not implemented."
    })
  }
}
