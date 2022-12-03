"use strict"

var m = require("./hyperscript")
var request = require("./request")
var mountRedraw = require("./mount-redraw")

m.Fragment = "["
m.mount = mountRedraw.mount
m.route = require("./route")
m.render = require("./render")
m.redraw = mountRedraw.redraw
m.request = request.request
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.parsePathname = require("./pathname/parse")
m.buildPathname = require("./pathname/build")
m.vnode = require("./render/vnode")
m.censor = require("./util/censor")

module.exports = m
