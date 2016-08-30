'use babel'

import Configuration from '../lib/configuration'

describe('Configuration', () => {
  describe('.getValueWithoutDefault', () => {
    it('ignores the default value', () => {
      const value = Configuration.getValue(Configuration.getKey("languages"))
      const valueWithoutDefault = Configuration.getValueWithoutDefault(Configuration.getKey("languages"))

      expect(value).toBe(atom.config.getSchema(Configuration.getKey("languages")).default)
      expect(valueWithoutDefault).toBe(undefined)
    })
  })
})
