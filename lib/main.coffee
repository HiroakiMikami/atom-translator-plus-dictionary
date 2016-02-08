CompositeDisposable = null
Language = null
Range = null
franc = null
NotificationView = null

module.exports = TranslatorPlusDictionary =
  subscriptions: null
  languages: null
  francOptions: null
  primaryLanguage: null
  secondaryLanguage: null

  notificationView: null

  config:
    languages:
      title: "Languages used in this package"
      description: "https://github.com/wooorm/franc/blob/master/Supported-Languages.md is a list of languages names. Languages are separated by comma(,)."
      type: 'string'
      default: 'eng,jpn'
    primaryLanguage:
      title: "The Primary Language"
      type: 'string'
      default: 'jpn'
    secondaryLanguage:
      title: "The Secondary Language"
      type: 'string'
      default: 'eng'

  activate: (state) ->
    # Initialize modules and classes
    Language ?= require('./language')
    CompositeDisposable ?= require('atom').CompositeDisposable
    Range ?= require('atom').Range
    franc ?= require('franc')
    NotificationView = require('./notification-view')

    # Initialize fields
    @subscriptions = new CompositeDisposable
    languageCodes = atom.config.get("translator-plus-dictionary.languages").split(/,\s*/)
    @languages = []
    @francOptions = {
      whitelist: []
      minLength: 1
    }
    for code in languageCodes
      language = Language.getFromCode(code)
      if language == null
        # TODO notify an error
        continue

      ## Store the used languages information in the form of Language class instances
      @languages.push(language)
      @francOptions.whitelist.push(code)
    @primaryLanguage = Language.getFromCode(atom.config.get("translator-plus-dictionary.primaryLanguage"))
    @secondaryLanguage = Language.getFromCode(atom.config.get("translator-plus-dictionary.secondaryLanguage"))

    @notificationView = new NotificationView()

    # Register the commands
    @subscriptions.add atom.commands.add 'atom-workspace', 'translator-plus-dictionary:translate': => @translate()

  consumeStatusBar: (statusBar) ->
    # Add a tile to the status bar
    @statusBarTile = statusBar.addLeftTile(item: @notificationView.statusBar, priority: 100)

  deactivate: ->
    @subscriptions.dispose()
    @statusBarTile?.destroy()
    @notificationView.destroy()

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

    for target in targets
      # Decide the languages of the texts by using franc
      from = franc(target.text, @francOptions)
      lang = Language.getFromCode(from)
      target.from = lang

      # Decide the output language by using the primary and secondary language
      if @primaryLanguage == lang
        target.to = @secondaryLanguage
      else
        target.to = @primaryLanguage
