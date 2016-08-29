'use babel'

export default class Dictionary {
  name() { return "" }
  canBeUsed(from, to) { return false }
  find(text, from, to, succeeded, failed) {
    failed({
      message: "find function is not implemented"
    })
  }
}
