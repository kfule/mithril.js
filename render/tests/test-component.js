"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("component", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")

		render = vdom($window)
	})

	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create

			o.spec("basics", function() {
				o("works", function() {
					var component = createComponent({
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})
					var node = m(component)

					render(root, node)

					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("receives arguments", function() {
					var component = createComponent({
						view: function(vnode) {
							return m("div", vnode.attrs, vnode.children)
						}
					})
					var node = m(component, {id: "a"}, "b")

					render(root, node)

					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("updates", function() {
					var component = createComponent({
						view: function(vnode) {
							return m("div", vnode.attrs, vnode.children)
						}
					})
					render(root, [m(component, {id: "a"}, "b")])
					render(root, [m(component, {id: "c"}, "d")])

					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("c")
					o(root.firstChild.firstChild.nodeValue).equals("d")
				})
				o("updates root from null", function() {
					var visible = false
					var component = createComponent({
						view: function() {
							return visible ? m("div") : null
						}
					})
					render(root, m(component))
					visible = true
					render(root, m(component))

					o(root.firstChild.nodeName).equals("DIV")
				})
				o("updates root from primitive", function() {
					var visible = false
					var component = createComponent({
						view: function() {
							return visible ? m("div") : false
						}
					})
					render(root, m(component))
					visible = true
					render(root, m(component))

					o(root.firstChild.nodeName).equals("DIV")
				})
				o("updates root to null", function() {
					var visible = true
					var component = createComponent({
						view: function() {
							return visible ? m("div") : null
						}
					})
					render(root, m(component))
					visible = false
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("updates root to primitive", function() {
					var visible = true
					var component = createComponent({
						view: function() {
							return visible ? m("div") : false
						}
					})
					render(root, m(component))
					visible = false
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("updates root from null to null", function() {
					var component = createComponent({
						view: function() {
							return null
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("removes", function() {
					var component = createComponent({
						view: function() {
							return m("div")
						}
					})
					var div = m("div", {key: 2})
					render(root, [m(component, {key: 1}), div])
					render(root, div)

					o(root.childNodes.length).equals(1)
					o(root.firstChild).equals(div.dom)
				})
				o("removes inner root content with key", function() {
					var key = "a"
					var component = createComponent({
						view: function() {
							return m("div", {key}, key)
						}
					})

					render(root, m(component))
					var fc1 = root.firstChild
					o(root.firstChild.firstChild.nodeValue).equals("a")

					key = "b"
					render(root, m(component))

					o(fc1).notEquals(root.firstChild)
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("updates inner root content without key", function() {
					var key = "a"
					var component = createComponent({
						view: function() {
							return m("div", key)
						}
					})

					render(root, m(component))
					var fc1 = root.firstChild
					o(root.firstChild.firstChild.nodeValue).equals("a")

					key = "b"
					render(root, m(component))

					o(fc1).equals(root.firstChild)
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("svg works when creating across component boundary", function() {
					var component = createComponent({
						view: function() {
							return m("g")
						}
					})
					render(root, m("svg", m(component)))

					o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
				})
				o("svg works when updating across component boundary", function() {
					var component = createComponent({
						view: function() {
							return m("g")
						}
					})
					render(root, m("svg", m(component)))
					render(root, m("svg", m(component)))

					o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
				})
			})
			o.spec("return value", function() {
				o("can return fragments", function() {
					var component = createComponent({
						view: function() {
							return [
								m("label"),
								m("input"),
							]
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("LABEL")
					o(root.childNodes[1].nodeName).equals("INPUT")
				})
				o("can return string", function() {
					var component = createComponent({
						view: function() {
							return "a"
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("a")
				})
				o("can return falsy string", function() {
					var component = createComponent({
						view: function() {
							return ""
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("")
				})
				o("can return number", function() {
					var component = createComponent({
						view: function() {
							return 1
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("1")
				})
				o("can return falsy number", function() {
					var component = createComponent({
						view: function() {
							return 0
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("0")
				})
				o("can return `true`", function() {
					var component = createComponent({
						view: function() {
							return true
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can return `false`", function() {
					var component = createComponent({
						view: function() {
							return false
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can return null", function() {
					var component = createComponent({
						view: function() {
							return null
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can return undefined", function() {
					var component = createComponent({
						view: function() {
							return undefined
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("throws a custom error if it returns itself when created", function() {
					// A view that returns its vnode would otherwise trigger an infinite loop
					var threw = false
					var component = createComponent({
						view: function(vnode) {
							return vnode
						}
					})
					try {
						render(root, m(component))
					}
					catch (e) {
						threw = true
						o(e instanceof Error).equals(true)
						// Call stack exception is a RangeError
						o(e instanceof RangeError).equals(false)
					}
					o(threw).equals(true)
				})
				o("throws a custom error if it returns itself when updated", function() {
					// A view that returns its vnode would otherwise trigger an infinite loop
					var threw = false
					var init = true
					var oninit = o.spy()
					var component = createComponent({
						oninit: oninit,
						view: function(vnode) {
							if (init) return init = false
							else return vnode
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)

					try {
						render(root, m(component))
					}
					catch (e) {
						threw = true
						o(e instanceof Error).equals(true)
						// Call stack exception is a RangeError
						o(e instanceof RangeError).equals(false)
					}
					o(threw).equals(true)
					o(oninit.callCount).equals(1)
				})
				o("can update when returning fragments", function() {
					var component = createComponent({
						view: function() {
							return [
								m("label"),
								m("input"),
							]
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("LABEL")
					o(root.childNodes[1].nodeName).equals("INPUT")
				})
				o("can update when returning primitive", function() {
					var component = createComponent({
						view: function() {
							return "a"
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("a")
				})
				o("can update when returning null", function() {
					var component = createComponent({
						view: function() {
							return null
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can remove when returning fragments", function() {
					var component = createComponent({
						view: function() {
							return [
								m("label"),
								m("input"),
							]
						}
					})
					var div = m("div", {key: 2})
					render(root, [m(component, {key: 1}), div])

					render(root, [m("div", {key: 2})])

					o(root.childNodes.length).equals(1)
					o(root.firstChild).equals(div.dom)
				})
				o("can remove when returning primitive", function() {
					var component = createComponent({
						view: function() {
							return "a"
						}
					})
					var div = m("div", {key: 2})
					render(root, [m(component, {key: 1}), div])

					render(root, [m("div", {key: 2})])

					o(root.childNodes.length).equals(1)
					o(root.firstChild).equals(div.dom)
				})
			})
			o.spec("lifecycle", function() {
				o("calls oninit", function() {
					var called = 0
					var component = createComponent({
						oninit: function(vnode) {
							called++

							o(vnode.tag).equals(component)
							o(vnode.dom).equals(undefined)
							o(root.childNodes.length).equals(0)
						},
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("calls oninit when returning fragment", function() {
					var called = 0
					var component = createComponent({
						oninit: function(vnode) {
							called++

							o(vnode.tag).equals(component)
							o(vnode.dom).equals(undefined)
							o(root.childNodes.length).equals(0)
						},
						view: function() {
							return [m("div", {id: "a"}, "b")]
						}
					})

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("calls oninit before view", function() {
					var viewCalled = false
					var component = createComponent({
						view: function() {
							viewCalled = true
							return m("div", {id: "a"}, "b")
						},
						oninit: function() {
							o(viewCalled).equals(false)
						},
					})

					render(root, m(component))
				})
				o("does not calls oninit on redraw", function() {
					var init = o.spy()
					var component = createComponent({
						view: function() {
							return m("div", {id: "a"}, "b")
						},
						oninit: init,
					})

					function view() {
						return m(component)
					}

					render(root, view())
					render(root, view())

					o(init.callCount).equals(1)
				})
				o("calls oncreate", function() {
					var called = 0
					var component = createComponent({
						oncreate: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("does not calls oncreate on redraw", function() {
					var create = o.spy()
					var component = createComponent({
						view: function() {
							return m("div", {id: "a"}, "b")
						},
						oncreate: create,
					})

					function view() {
						return m(component)
					}

					render(root, view())
					render(root, view())

					o(create.callCount).equals(1)
				})
				o("calls oncreate when returning fragment", function() {
					var called = 0
					var component = createComponent({
						oncreate: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("calls onupdate", function() {
					var called = 0
					var component = createComponent({
						onupdate: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})

					render(root, m(component))

					o(called).equals(0)

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("calls onupdate when returning fragment", function() {
					var called = 0
					var component = createComponent({
						onupdate: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return [m("div", {id: "a"}, "b")]
						}
					})

					render(root, m(component))

					o(called).equals(0)

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("calls onremove", function() {
					var called = 0
					var component = createComponent({
						onremove: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})

					render(root, m(component))

					o(called).equals(0)

					render(root, [])

					o(called).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("calls onremove when returning fragment", function() {
					var called = 0
					var component = createComponent({
						onremove: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return [m("div", {id: "a"}, "b")]
						}
					})

					render(root, m(component))

					o(called).equals(0)

					render(root, [])

					o(called).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("calls onbeforeremove", function() {
					var called = 0
					var component = createComponent({
						onbeforeremove: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})

					render(root, m(component))

					o(called).equals(0)

					render(root, [])

					o(called).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("calls onbeforeremove when returning fragment", function() {
					var called = 0
					var component = createComponent({
						onbeforeremove: function(vnode) {
							called++

							o(vnode.dom).notEquals(undefined)
							o(vnode.dom).equals(root.firstChild)
							o(root.childNodes.length).equals(1)
						},
						view: function() {
							return [m("div", {id: "a"}, "b")]
						}
					})

					render(root, m(component))

					o(called).equals(0)

					render(root, [])

					o(called).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("does not recycle when there's an onupdate", function() {
					var component = createComponent({
						onupdate: function() {},
						view: function() {
							return m("div")
						}
					})
					var vnode = m(component, {key: 1})
					var updated = m(component, {key: 1})

					render(root, vnode)
					render(root, [])
					render(root, updated)

					o(vnode.dom).notEquals(updated.dom)
				})
				o("lifecycle timing megatest (for a single component)", function() {
					var methods = {
						view: o.spy(function() {
							return ""
						})
					}
					var attrs = {}
					var hooks = [
						"oninit", "oncreate", "onbeforeupdate",
						"onupdate", "onbeforeremove", "onremove"
					]
					hooks.forEach(function(hook) {
						if (hook === "onbeforeupdate") {
							// the component's `onbeforeupdate` is called after the `attrs`' one
							attrs[hook] = o.spy(function() {
								o(attrs[hook].callCount).equals(methods[hook].callCount + 1)(hook)
							})
							methods[hook] = o.spy(function() {
								o(attrs[hook].callCount).equals(methods[hook].callCount)(hook)
							})
						} else {
							// the other component hooks are called before the `attrs` ones
							methods[hook] = o.spy(function() {
								o(attrs[hook].callCount).equals(methods[hook].callCount - 1)(hook)
							})
							attrs[hook] = o.spy(function() {
								o(attrs[hook].callCount).equals(methods[hook].callCount)(hook)
							})
						}
					})

					var component = createComponent(methods)

					o(methods.view.callCount).equals(0)
					o(methods.oninit.callCount).equals(0)
					o(methods.oncreate.callCount).equals(0)
					o(methods.onbeforeupdate.callCount).equals(0)
					o(methods.onupdate.callCount).equals(0)
					o(methods.onbeforeremove.callCount).equals(0)
					o(methods.onremove.callCount).equals(0)

					hooks.forEach(function(hook) {
						o(attrs[hook].callCount).equals(methods[hook].callCount)(hook)
					})

					render(root, [m(component, attrs)])

					o(methods.view.callCount).equals(1)
					o(methods.oninit.callCount).equals(1)
					o(methods.oncreate.callCount).equals(1)
					o(methods.onbeforeupdate.callCount).equals(0)
					o(methods.onupdate.callCount).equals(0)
					o(methods.onbeforeremove.callCount).equals(0)
					o(methods.onremove.callCount).equals(0)

					hooks.forEach(function(hook) {
						o(attrs[hook].callCount).equals(methods[hook].callCount)(hook)
					})

					render(root, [m(component, attrs)])

					o(methods.view.callCount).equals(2)
					o(methods.oninit.callCount).equals(1)
					o(methods.oncreate.callCount).equals(1)
					o(methods.onbeforeupdate.callCount).equals(1)
					o(methods.onupdate.callCount).equals(1)
					o(methods.onbeforeremove.callCount).equals(0)
					o(methods.onremove.callCount).equals(0)

					hooks.forEach(function(hook) {
						o(attrs[hook].callCount).equals(methods[hook].callCount)(hook)
					})

					render(root, [])

					o(methods.view.callCount).equals(2)
					o(methods.oninit.callCount).equals(1)
					o(methods.oncreate.callCount).equals(1)
					o(methods.onbeforeupdate.callCount).equals(1)
					o(methods.onupdate.callCount).equals(1)
					o(methods.onbeforeremove.callCount).equals(1)
					o(methods.onremove.callCount).equals(1)

					hooks.forEach(function(hook) {
						o(attrs[hook].callCount).equals(methods[hook].callCount)(hook)
					})
				})
				o("hook state and arguments validation", function(){
					var methods = {
						view: o.spy(function(vnode) {
							o(this).equals(vnode.state)
							return ""
						})
					}
					var attrs = {}
					var hooks = [
						"oninit", "oncreate", "onbeforeupdate",
						"onupdate", "onbeforeremove", "onremove"
					]
					hooks.forEach(function(hook) {
						attrs[hook] = o.spy(function(vnode){
							o(this).equals(vnode.state)(hook)
						})
						methods[hook] = o.spy(function(vnode){
							o(this).equals(vnode.state)
						})
					})

					var component = createComponent(methods)

					render(root, [m(component, attrs)])
					render(root, [m(component, attrs)])
					render(root, [])

					hooks.forEach(function(hook) {
						o(attrs[hook].this).equals(methods.view.this)(hook)
						o(methods[hook].this).equals(methods.view.this)(hook)
					})

					o(methods.view.args.length).equals(1)
					o(methods.oninit.args.length).equals(1)
					o(methods.oncreate.args.length).equals(1)
					o(methods.onbeforeupdate.args.length).equals(2)
					o(methods.onupdate.args.length).equals(1)
					o(methods.onbeforeremove.args.length).equals(1)
					o(methods.onremove.args.length).equals(1)

					hooks.forEach(function(hook) {
						o(methods[hook].args.length).equals(attrs[hook].args.length)(hook)
					})
				})
				o("no recycling occurs (was: recycled components get a fresh state)", function() {
					var step = 0
					var firstState
					var view = o.spy(function(vnode) {
						if (step === 0) {
							firstState = vnode.state
						} else {
							o(vnode.state).notEquals(firstState)
						}
						return m("div")
					})
					var component = createComponent({view: view})

					render(root, [m("div", m(component, {key: 1}))])
					var child = root.firstChild.firstChild
					render(root, [])
					step = 1
					render(root, [m("div", m(component, {key: 1}))])

					o(child).notEquals(root.firstChild.firstChild) // this used to be a recycling pool test
					o(view.callCount).equals(2)
				})
			})
			o.spec("state", function() {
				o("initializes state", function() {
					var data = {a: 1}
					var component = createComponent(createComponent({
						data: data,
						oninit: init,
						view: function() {
							return ""
						}
					}))

					render(root, m(component))

					function init(vnode) {
						o(vnode.state.data).equals(data)
					}
				})
				o("state proxies to the component object/prototype", function() {
					var body = {a: 1}
					var data = [body]
					var component = createComponent(createComponent({
						data: data,
						oninit: init,
						view: function() {
							return ""
						}
					}))

					render(root, m(component))

					function init(vnode) {
						o(vnode.state.data).equals(data)
						o(vnode.state.data[0]).equals(body)
					}
				})
			})
		})
	})
	o.spec("Tests specific to certain component kinds", function() {
		o.spec("state", function() {
			o("POJO", function() {
				var data = {}
				var component = {
					data: data,
					oninit: init,
					view: function() {
						return ""
					}
				}

				render(root, m(component))

				function init(vnode) {
					o(vnode.state.data).equals(data)

					//inherits state via prototype
					component.x = 1
					o(vnode.state.x).equals(1)
				}
			})
			o("Constructible", function() {
				var oninit = o.spy()
				var component = o.spy(function(vnode){
					o(vnode.state).equals(undefined)
					o(oninit.callCount).equals(0)
				})
				var view = o.spy(function(){
					o(this instanceof component).equals(true)
					return ""
				})
				component.prototype.view = view
				component.prototype.oninit = oninit

				render(root, [m(component, {oninit: oninit})])
				render(root, [m(component, {oninit: oninit})])
				render(root, [])

				o(component.callCount).equals(1)
				o(oninit.callCount).equals(2)
				o(view.callCount).equals(2)
			})
			o("Closure", function() {
				var state
				var oninit = o.spy()
				var view = o.spy(function() {
					o(this).equals(state)
					return ""
				})
				var component = o.spy(function(vnode) {
					o(vnode.state).equals(undefined)
					o(oninit.callCount).equals(0)
					return state = {
						view: view
					}
				})

				render(root, [m(component, {oninit: oninit})])
				render(root, [m(component, {oninit: oninit})])
				render(root, [])

				o(component.callCount).equals(1)
				o(oninit.callCount).equals(1)
				o(view.callCount).equals(2)
			})
		})
	})
})
