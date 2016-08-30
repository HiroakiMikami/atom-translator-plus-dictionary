'use babel'

import { PACKAGE_NAME } from "./constants"

export default {
  getKey(name) {
    if (!name) {
      return PACKAGE_NAME
    } else if (typeof(name) === "string") {
      return `${PACKAGE_NAME}.${name}`
    } else {
      return `${PACKAGE_NAME}.${name.join(".")}`
    }
  },
  getValue(name) {
    return atom.config.get(this.getKey(name))
  },
  getValueWithoutDefault(name) {
    return atom.config.get(this.getKey(name), {
      sources: [atom.config.configFilePath]
    })
  }
}
