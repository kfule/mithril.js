"use strict"

var hyperscript = require("./render/hyperscript")

hyperscript.trust = require("./render/trust")
hyperscript.fragment = require("./render/fragment")
hyperscript.Fragment = "["

module.exports = hyperscript
