'use babel'

export default class Dictionary {
  name() { return "" }
  canBeUsed(from, to) { return false }
  find(text, from, to) {
    return new Promise((resolve, reject) => {
      reject({
        message: "translate function is not implemented."
      })
    })
  }
}
