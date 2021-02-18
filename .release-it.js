const package = require("./package.json")

module.exports = {
    "git":false,
    "npm":{
        "publish":false
    },
    "increment":false,
    "hooks":{
        "before:release":"rimraf lib && rimraf *.tgz && tsc && npm pack",
        "after:release":"rimraf *.tgz"
    },
    "github": {
      "release": true,
      "assets":["./*.tgz"],
      "releaseName": `${package.name} ${version}`
    }
}