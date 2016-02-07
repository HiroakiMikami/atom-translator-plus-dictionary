CompositeDisposable = null
Range = null

module.exports = TranslatorPlusDictionary =
  subscriptions: null

  activate: (state) ->
    # Initialize modules and classes
    CompositeDisposable ?= require('atom').CompositeDisposable
    Range ?= require('atom').Range

    # Initialize fields
    @subscriptions = new CompositeDisposable

    # Register the commands
    @subscriptions.add atom.commands.add 'atom-workspace', 'translator-plus-dictionary:translate': => @translate()

  deactivate: ->
    @subscriptions.dispose()

  serialize: ->

  translate: ->
    editor = atom.workspace.getActiveTextEditor()
    return unless editor?

    targets = []

    # Get texts from selected texts
    for range in editor.getSelectedBufferRanges()
      if (range.start.row == range.end.row) && (range.start.column == range.end.column)
        continue
      text = editor.getTextInRange(range)
      targets.push({
        range: range
        text: text
      })

    if targets.length == 0
      # Get words from cursor positions if no text are selected
      for cursor in editor.getCursors()
        beginWord = cursor.getBeginningOfCurrentWordBufferPosition()
        endWord = cursor.getEndOfCurrentWordBufferPosition()
        range = new Range(beginWord, endWord)

        targets.push({
          range: range
          text: editor.getTextInRange(range)
        })
