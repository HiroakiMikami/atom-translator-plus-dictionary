'use babel'

import Language from '../lib/language';

describe('Language', () => {
  describe('.getFromName', () => {
    it('returns the instance of Language', () => {
      const l = Language.getFromName("English")
      expect(l.name).toBe("English")
      expect(l.code).toBe("eng")
    })
  })
  describe('.getFromCode', () => {
    it('returns the instance of Language', () => {
      const l = Language.getFromCode("eng")
      expect(l.name).toBe("English")
      expect(l.code).toBe("eng")
    })
  })
})
