# Modules
CompositeDisposable = null
Language = null
Range = null
franc = null
NotificationView = null
TranslatorPlusDictionary = null
TranslatorPlusDictionaryView = null
ExternalApis = null
MicrosoftTranslatorClient = null
Dejizo = null

module.exports = TranslatorPlusDictionary =
  subscriptions: null
  languages: null
  francOptions: null
  primaryLanguage: null
  secondaryLanguage: null

  translatorPlusDictionary: null
  notificationView: null

  views: null

  config:
    microsoftTranslatorClientId:
      title: 'Client ID of Microsoft Translator API'
      type: 'string'
      default: ''
    microsoftTranslatorClientSecret:
      title: 'Client Secret of Microsoft Translator API'
      type: 'string'
      default: ''
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
    TranslatorPlusDictionaryView = require('./translator-plus-dictionary-view')
    TranslatorPlusDictionary = require('./translator-plus-dictionary')
    ExternalApis = require('./external-apis')
    MicrosoftTranslatorClient = require('./microsoft-translator-client')
    Dejizo = require('./dejizo')

    # Initialize fields
    @subscriptions = new CompositeDisposable
    @views = []
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

      ## Store the usable languages information in the form of Language class instances
      @languages.push(language)
      @francOptions.whitelist.push(code)
    @primaryLanguage = Language.getFromCode(atom.config.get("translator-plus-dictionary.primaryLanguage"))
    @secondaryLanguage = Language.getFromCode(atom.config.get("translator-plus-dictionary.secondaryLanguage"))

    @notificationView = new NotificationView()

    @translatorPlusDictionary = new TranslatorPlusDictionary()
    # Add Microsoft Translator
    microsoftTranslatorClientId = atom.config.get("translator-plus-dictionary.microsoftTranslatorClientId")
    microsoftTranslatorClientSecret = atom.config.get("translator-plus-dictionary.microsoftTranslatorClientSecret")
    microsoftTranslatorClient = new MicrosoftTranslatorClient(microsoftTranslatorClientId, microsoftTranslatorClientSecret)
    @translatorPlusDictionary.translators.push(microsoftTranslatorClient)
    # Add Dejizo
    dejizo = new Dejizo()
    @translatorPlusDictionary.dictionaries.push(dejizo)

    # Wire all components
    @translatorPlusDictionary.onStarted(@notificationView.started)
    @translatorPlusDictionary.onFinished(@notificationView.finished)
    @translatorPlusDictionary.onFailed(@notificationView.failed)

    # Register the commands
    @subscriptions.add atom.commands.add 'atom-text-editor', 'translator-plus-dictionary:translate': => @translate()
    @subscriptions.add atom.commands.add 'atom-text-editor', 'translator-plus-dictionary:close-all': => @closeAll()

    # Load external APIs
    ExternalApis.load(@translatorPlusDictionary)

  consumeStatusBar: (statusBar) ->
    # Add a tile to the status bar
    @statusBarTile = statusBar.addLeftTile(item: @notificationView.statusBar, priority: 100)

  deactivate: ->
    for view in @views
      view.destroy()
    @subscriptions.dispose()
    @statusBarTile?.destroy()
    @notificationView.destroy()

  serialize: ->

  closeView: (view) ->
    for i in [0...@views.length]
      if @views[i] == view then @views.slice(i, 1)
    view.destroy()
  closeAll: ->
    for v in @views
      v.destroy()
    @views = []

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

      # Generate a view
      view = new TranslatorPlusDictionaryView(
        editor,
        target,
        @languages,
        @translatorPlusDictionary
      )
      @views.push(view)
      view.onClosed( => @closeView(view))
