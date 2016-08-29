'use babel'

import TranslatorPlusDictionary from "../lib/translator-plus-dictionary"
import ExternalApis from '../lib/external-apis'
import fs from 'fs'
import path from 'path'
import { PACKAGE_PATH } from '../lib/constants'

describe('ExternalApis', () => {
  describe('.load', () => {
    it('adds the APIs to TranslatorPlusDictionary', () => {
      const apis = new ExternalApis({
        translatorsPath: path.join(PACKAGE_PATH, "spec", "external-apis-translators.js")
      })
      const target = new TranslatorPlusDictionary()

      expect(target.translators.length).toBe(0)
      apis.load(target)
      expect(target.translators.length).toBe(1)
    })
  })
})
