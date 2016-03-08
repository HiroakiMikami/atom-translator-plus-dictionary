# translator-plus-dictionary
This package enables you to translate a text and consult a dictionary. Currently, [Microsoft Translator](https://www.microsoft.com/en-us/translator/default.aspx) and [Dejizo](https://dejizo.jp/dev/) are supported. Other APIs can be added(see External APIs below).

![](http://hiroakimikami.github.io/atom-translator-plus-dictionary/screenshot.gif)

## Usage
### Settings
#### 1. Put your client ID and client secret of Microsoft Translator.
First, put your id and secret of Microsoft Translator API to `Client ID of Microsoft Translator API` and `Client Secret of Microsoft Translator API` in the Settings view of this package.

Please see [this page](https://www.microsoft.com/en-us/translator/getstarted.aspx) to understand how to obtain the client ID and cliet secret.

#### 2. Set the languages that you usually use.
Second, set languages used in this package.
For example, I (Hiroaki Mikami) set "jpn" and "eng" because I'm Japanese and I have to use English.

#### 3. Set the primary / secondary languages.
Finally, set the primary / secondary languages to decide the language used in translation.
I recommend to set your native language to the primary language, and to set "eng"(English) to the secondary language.

### Commands
#### `translator-plus-dictionary:translate` (`Ctrl-c Ctrl-t` by default)
Opens views, translate a selected text, and consult a dictionary. If no text is selected, this package uses a word that the cursor of Atom.io is positioned in.

#### `translator-plus-dictionary:close-all` (`Esc` by default)
Close all views.

## Features
### Language Detection
This package recognizes the language by using [franc](https://github.com/wooorm/franc). Thus, you do not have to select the languages when you translate a text or consult a dictionary.

### External APIs
This package adds all translator/dictionary APIs declared in the `.atom/dictionaries.coffee` or `./atom/translators.coffee`.

#### Example
Example of a `.atom/translators.coffee` file
```CoffeeScript:translators.coffee
module.exports = Translators = [
  {
    name: "Sample API"
    canBeUsed: (from, to) -> from.code == 'en'
    translate: (text, from, to, succeeded, failed) ->
      # Use an API, and invoke callback functions(succeeded or failed)
  }
]
```

Example of a `.atom/dictionaries.coffee` file
```CoffeeScript:dictionaries.coffee
module.exports = Dictionaries = [
  {
    name: "Sample API"
    canBeUsed: (from, to) -> from.code == 'en'
    find: (text, from, to, succeeded, failed) ->
      # Use an API, and invoke callback functions(succeeded or failed)
      # Currently, translators and dictionaries are not
  }
]
```

A [sample directory](./sample) contains simple examples of external APIs.

## License
This software is released under the MIT License, see [LICENSE.md](LICENSE.md).
