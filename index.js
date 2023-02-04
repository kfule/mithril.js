"use strict"

var m = require("./hyperscript")
var mountRedraw = require("./mount-redraw")

m.Fragment = "["
m.mount = mountRedraw.mount
m.render = require("./render")
m.redraw = mountRedraw.redraw
m.vnode = require("./render/vnode")
m.censor = require("./util/censor")

module.exports = m
