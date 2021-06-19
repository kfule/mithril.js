"use strict"

var mountRedraw = require("./mount-redraw")
var Promise = require("./promise/promise")

module.exports = require("./api/router")(typeof window !== "undefined" ? window : null, mountRedraw, Promise)
