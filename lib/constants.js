'use babel';

const fs = require('fs')

const packageName = "translator-plus-dictionary"
const packagePath = atom.packages.resolvePackagePath(packageName) || fs.realpathSync("./")
const hoganDirectoryPath = `${packagePath}/hogan-templates`

export {
  packageName as PACKAGE_NAME,
  packagePath as PACKAGE_PATH,
  hoganDirectoryPath as PUG_DIRECTORY_PATH
}
