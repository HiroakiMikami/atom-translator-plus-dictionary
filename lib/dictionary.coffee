module.exports =
class Dictionary
  name: -> ""
  canBeUsed: (from, to) -> false
  find: (text, from, to, succeeded, failed) ->
    failed({
      message: "find function is not implemented."
    })
