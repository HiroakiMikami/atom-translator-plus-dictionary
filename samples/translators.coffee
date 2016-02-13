module.exports = Translators = [
  {
    name: -> "The name of Translator"
    canBeUsed: (from, to) ->
      ###
      Return true when this API can translate texts from #{from} to #{to}
      #{from} and #{to} are instances of Language class.
      ###
      true
    translate: (text, from, to, succeeded, failed) ->
      # Translate #{text} from #{from} to #{to}
      try
        succeeded("<b>Result</b>") # result can contain HTML tags.
      catch error
        failed("error")
  }
]
