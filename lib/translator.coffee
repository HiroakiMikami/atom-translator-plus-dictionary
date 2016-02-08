module.exports =
class Translator
  name: -> ""
  canBeUsed: (from, to) -> false
  translate: (text, from, to, succeeded, failed) ->
    failed({
      message: "translate function is not implemented."
    })
