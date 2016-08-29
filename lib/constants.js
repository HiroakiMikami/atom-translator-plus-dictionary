'use babel';

const fs = require('fs')

const packageName = "translator-plus-dictionary"
const packagePath = atom.packages.resolvePackagePath(packageName) || fs.realpathSync("./")
const pugDirectoryPath = `${packagePath}/pug`

export {
  packageName as PACKAGE_NAME,
  packagePath as PACKAGE_PATH,
  pugDirectoryPath as PUG_DIRECTORY_PATH
}
