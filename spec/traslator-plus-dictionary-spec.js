'use babel'

import Language from '../lib/language';
import Translator from '../lib/translator'
import TranslatorPlusDictionary from '../lib/translator-plus-dictionary'

class StubTranslator extends Translator {
  constructor(from, to, result, called) {
    super();
    this.from = from
    this.to = to
    this.result = result
    this.called = called
  }
  canBeUsed(from, to) { return (from === this.from) && (to === this.to) }
  translate(text, from, to) {
    this.called()
    return new Promise((resolve) => {
      resolve(this.result)
    })
  }
}

describe('TranslatorPlusDictionary', () => {
  describe('.translate', () => {
    it('emits "Started" event at the beginning of the process', () => {
      let isCalled = false
      const target = new TranslatorPlusDictionary()
      target.onStarted(() => {
        isCalled = true
      })

      target.translate("", Language.getFromCode("eng"), Language.getFromCode("jpn"), () => {}, () => {})
      expect(isCalled).toBe(true)
    })
    it('invokes APIs', () => {
      let isCalled = false
      const target = new TranslatorPlusDictionary()

      target.translators.push(new StubTranslator(
        Language.getFromCode("eng"), Language.getFromCode("jpn"), "",
        () => { isCalled = true }
      ))

      target.translate("", Language.getFromCode("eng"), Language.getFromCode("jpn"), () => {}, () => {})
      expect(isCalled).toBe(true)
    })
    it('does not invoke an API that cannot be used', () => {
      let isCalled = false
      const target = new TranslatorPlusDictionary()

      target.translators.push(new StubTranslator(
        Language.getFromCode("jpn"), Language.getFromCode("eng"), "",
        () => { isCalled = true }
      ))

      target.translate("", Language.getFromCode("eng"), Language.getFromCode("jpn"), () => {}, () => {})
      expect(isCalled).toBe(false)
    })
    it('emits "Finished" event if all APIs return the results.', () => {
      let isCalled = false
      waitsForPromise(() => {
        return new Promise((resolve) => {
          const target = new TranslatorPlusDictionary()
          target.onFinished(() => {
            isCalled = true
            resolve()
          })

          target.translators.push(new StubTranslator(
            Language.getFromCode("eng"), Language.getFromCode("jpn"), "",
            () => {}
          ))

          target.translate("", Language.getFromCode("eng"), Language.getFromCode("jpn"), () => {}, () => {})
        })
      })
      runs(() => expect(isCalled).toBe(true))
    })
    it('emits "Failed" event if there is no APIs', () => {
      let isCalled = false
      const target = new TranslatorPlusDictionary()
      target.onFailed(() => {
        isCalled = true
      })

      target.translate("", Language.getFromCode("eng"), Language.getFromCode("jpn"), () => {}, () => {})
      expect(isCalled).toBe(true)
    })
  })
})
