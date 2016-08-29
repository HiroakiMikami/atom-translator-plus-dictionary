module.exports = Translators = [
  {
    name: () => { return "" },
    canBeUsed: (from, to) => {
      return true
    },
    translate: (text, from, to, succeeded, failed) => {
      try {
        succeeded("<b>Result</b>")
      } catch (error) {
        failed("error")
      }
    }
  }
]
