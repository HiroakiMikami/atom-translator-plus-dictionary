'use babel'

let franc = null
let CompositeDisposable = null
let Range = null
let Language = null
let TranslatorPlusDictionary = null
let TranslatorPlusDictionaryView = null
let NotificationView = null
let ExternalApis = null
let MicrosoftTranslatorClient = null
let Dejizo = null

let isInitialized = false
function initialize() {
  if (isInitialized) return

  // Initialize modules
  franc = require('franc')
  const atom = require('atom')
  CompositeDisposable = atom.CompositeDisposable
  Range = atom.Range

  // Initialize the local modules
  Language = require('./language')
  TranslatorPlusDictionary = require('./translator-plus-dictionary')
  TranslatorPlusDictionaryView = require('./translator-plus-dictionary-view')
  ExternalApis = require('./external-apis')
  NotificationView = require('./notification-view')
  MicrosoftTranslatorClient = require('./microsoft-translator-client')
  Dejizo = require('./dejizo')

  isInitialized = true
}

export default {
  config: {
    microsoftTranslatorClientId: {
      title: 'Client ID of Microsoft Translator API',
      type: 'string',
      default: ''
    },
    microsoftTranslatorClientSecret: {
      title: 'Client Secret of Microsoft Translator API',
      type: 'string',
      default: ''
    },
    languages: {
      title: "Languages used in this package",
      description: "https://github.com/wooorm/franc/blob/master/Supported-Languages.md is a list of languages names. Languages are separated by comma(,).",
      type: 'string',
      default: 'eng,jpn'
    },
    primaryLanguage: {
      title: "The Primary Language",
      type: 'string',
      default: 'jpn'
    },
    secondaryLanguage: {
      title: "The Secondary Language",
      type: 'string',
      default: 'eng'
    }
  },
  activate() {
    initialize()

    // Initialize the field
    this.subscriptions = new CompositeDisposable()
    this.languages = []
    this.francOptions = { whitelist: [], minLength: 1 }
    this.translatorPlusDictionary = new TranslatorPlusDictionary()
    this.notificationView = new NotificationView()
    this.views = []

    // Initialize languages
    const languageCodes = atom.config.get('translator-plus-dictionary.languages').split(/,\s*/)
    languageCodes.forEach((code) => {
      language = Language.getFromCode(code)
      if (language === null) {
        // TODO notify anerror
        return
      }

      // Store the usable languages information in the form of Language class instances
      this.languages.push(language)
      this.francOptions.whitelist.push(code)
    })
    this.primaryLanguage = Language.getFromCode(atom.config.get('translator-plus-dictionary.primaryLanguage'))
    this.secondaryLanguage = Language.getFromCode(atom.config.get('translator-plus-dictionary.secondaryLanguage'))

    // Add Microsoft Translator
    const microsoftTranslatorClientId = atom.config.get('translator-plus-dictionary.microsoftTranslatorClientId')
    const microsoftTranslatorClientSecret = atom.config.get('translator-plus-dictionary.microsoftTranslatorClientSecret')
    const microsoftTranslatorClient = new MicrosoftTranslatorClient(microsoftTranslatorClientId, microsoftTranslatorClientSecret)
    this.translatorPlusDictionary.translators.push(microsoftTranslatorClient)

    // Add Dejizo
    const dejizo = new Dejizo()
    this.translatorPlusDictionary.dictionaries.push(dejizo)

    // Load external APIs
    ExternalApis.load(this.translatorPlusDictionary)

    // Wire translatorPlusDictionary and NotificationView
    this.subscriptions.add(
      this.translatorPlusDictionary.onStarted(this.notificationView.started)
    )
    this.subscriptions.add(
      this.translatorPlusDictionary.onFinished(this.notificationView.finished)
    )
    this.subscriptions.add(
      this.translatorPlusDictionary.onFailed(this.notificationView.failed)
    )

    // Register the commands
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', { 'translator-plus-dictionary:translate': () => this.translate() })
    )
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', { 'translator-plus-dictionary:close-all': () => this.closeAll() })
    )
  },
  consumeStatusBar(statusBar) {
    // Add a tile to the status bar
    this.statusBarTile = statusBar.addLeftTile({
      item: this.notificationView.statusBar,
      priority: 100
    })
  },
  deactivate() {
    this.views.forEach((view) => view.destory())
    this.subscriptions.dispose()
    if (this.statusBarTile) {
      this.statusBarTile.destory()
    }
    this.notificationView.destory()
  },
  serialize() {},
  closeView(view) {
    for (let i = 0; i < this.views.length; i++) {
      if (this.views[i] === view) {
        this.views.slice(i, 1)
      }
    }
    view.destroy()
  },
  closeAll() {
    for (const v of this.views ) {
      v.destroy()
    }
    this.views = []
  },
  translate() {
    const editor = atom.workspace.getActiveTextEditor()

    if (!editor) return

    let targets = []

    // Get texts from selected texts
    for (const range of editor.getSelectedBufferRanges()) {
      if ((range.start.row === range.end.row) && (range.start.column === range.end.column)) continue
      text = editor.getTextInRange(range)
      targets.push({
        range: range,
        text: text
      })
    }

    if (targets.length === 0) {
      // Get words from cursor positions if no text are selected
      for (const cursor of editor.getCursors()) {
        const beginWord = cursor.getBeginningOfCurrentWordBufferPosition()
        const endWord = cursor.getEndOfCurrentWordBufferPosition()
        const range = new Range(beginWord, endWord)

        targets.push({
          range: range,
          text: editor.getTextInRange(range)
        })
      }
    }

    for (const target of targets) {
      // Decide the language of the texts by using frac
      const from = franc(target.text, this.francOptions)
      const lang = Language.getFromCode(from)
      target.from = lang

      // Decide the output language by using the primary and secondary languages
      if (this.primaryLanguage === lang) {
        target.to = this.secondaryLanguage
      } else {
        target.to = this.primaryLanguage
      }

      // Generate a view
      const view = new TranslatorPlusDictionaryView(
        editor, target, this.languages, this.translatorPlusDictionary
      )
      this.views.push(view)
      view.onClosed(() => { this.closeView(view) })
    }
  }
}
