;(function() {
"use strict"
function Vnode(tag, key, attrs0, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs0, children: children, text: text, dom: dom, state: undefined, events: undefined, instance: undefined}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	if (node == null || typeof node === "boolean") return null
	if (typeof node === "object") return node
	return Vnode("#", undefined, undefined, String(node), undefined, undefined)
}
Vnode.normalizeChildren = function(input) {
	var children = []
	if (input.length) {
		var isKeyed = input[0] != null && input[0].key != null
		// Note: this is a *very* perf-sensitive check.
		// Fun fact: merging the loop like this is somehow faster than splitting
		// it, noticeably so.
		for (var i = 1; i < input.length; i++) {
			if ((input[i] != null && input[i].key != null) !== isKeyed) {
				throw new TypeError(
					isKeyed && (input[i] != null || typeof input[i] === "boolean")
						? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit keyed empty fragment, m(m.Fragment, {key: ...}), instead of a hole."
						: "In fragments, vnodes must either all have keys or none have keys."
				)
			}
		}
		for (var i = 0; i < input.length; i++) {
			children[i] = Vnode.normalize(input[i])
		}
	}
	return children
}
// Call via `hyperscriptVnode0.apply(startOffset, arguments)`
//
// The reason I do it this way, forwarding the arguments and passing the start
// offset in `this`, is so I don't have to create a temporary array in a
// performance-critical path.
//
// In native ES6, I'd instead add a final `...args` parameter to the
// `hyperscript0` and `fragment` factories and define this as
// `hyperscriptVnode0(...args)`, since modern engines do optimize that away. But
// ES5 (what Mithril.js requires thanks to IE support) doesn't give me that luxury,
// and engines aren't nearly intelligent enough to do either of these:
//
// 1. Elide the allocation for `[].slice.call(arguments, 1)` when it's passed to
//    another function only to be indexed.
// 2. Elide an `arguments` allocation when it's passed to any function other
//    than `Function.prototype.apply` or `Reflect.apply`.
//
// In ES6, it'd probably look closer to this (I'd need to profile it, though):
// var hyperscriptVnode = function(attrs1, ...children0) {
//     if (attrs1 == null || typeof attrs1 === "object" && attrs1.tag == null && !Array.isArray(attrs1)) {
//         if (children0.length === 1 && Array.isArray(children0[0])) children0 = children0[0]
//     } else {
//         children0 = children0.length === 0 && Array.isArray(attrs1) ? attrs1 : [attrs1, ...children0]
//         attrs1 = undefined
//     }
//
//     if (attrs1 == null) attrs1 = {}
//     return Vnode("", attrs1.key, attrs1, children0)
// }
var hyperscriptVnode = function() {
	var attrs1 = arguments[this], start = this + 1, children0
	if (attrs1 == null) {
		attrs1 = {}
	} else if (typeof attrs1 !== "object" || attrs1.tag != null || Array.isArray(attrs1)) {
		attrs1 = {}
		start = this
	}
	if (arguments.length === start + 1) {
		children0 = arguments[start]
		if (!Array.isArray(children0)) children0 = [children0]
	} else {
		children0 = []
		while (start < arguments.length) children0.push(arguments[start++])
	}
	return Vnode("", attrs1.key, attrs1, children0)
}
// This exists so I'm1 only saving it once.
var hasOwn = {}.hasOwnProperty
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}
function isEmpty(object) {
	for (var key in object) if (hasOwn.call(object, key)) return false
	return true
}
function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {}
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2]
		if (type === "" && value !== "") tag = value
		else if (type === "#") attrs.id = value
		else if (type === ".") classes.push(value)
		else if (match[3][0] === "[") {
			var attrValue = match[6]
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
			if (match[4] === "class") classes.push(attrValue)
			else attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ")
	return selectorCache[selector] = {tag: tag, attrs: attrs}
}
function execSelector(state, vnode) {
	var attrs = vnode.attrs
	var hasClass = hasOwn.call(attrs, "class")
	var className = hasClass ? attrs.class : attrs.className
	vnode.tag = state.tag
	vnode.attrs = {}
	if (!isEmpty(state.attrs) && !isEmpty(attrs)) {
		var newAttrs = {}
		for (var key in attrs) {
			if (hasOwn.call(attrs, key)) newAttrs[key] = attrs[key]
		}
		attrs = newAttrs
	}
	for (var key in state.attrs) {
		if (hasOwn.call(state.attrs, key) && key !== "className" && !hasOwn.call(attrs, key)){
			attrs[key] = state.attrs[key]
		}
	}
	if (className != null || state.attrs.className != null) attrs.className =
		className != null
			? state.attrs.className != null
				? String(state.attrs.className) + " " + String(className)
				: className
			: state.attrs.className != null
				? state.attrs.className
				: null
	if (hasClass) attrs.class = null
	for (var key in attrs) {
		if (hasOwn.call(attrs, key) && key !== "key") {
			vnode.attrs = attrs
			break
		}
	}
	return vnode
}
function hyperscript(selector) {
	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}
	var vnode = hyperscriptVnode.apply(1, arguments)
	if (typeof selector === "string") {
		vnode.children = Vnode.normalizeChildren(vnode.children)
		if (selector !== "[") return execSelector(selectorCache[selector] || compileSelector(selector), vnode)
	}
	vnode.tag = selector
	return vnode
}
hyperscript.trust = function(html) {
	if (html == null) html = ""
	return Vnode("<", undefined, undefined, html, undefined, undefined)
}
var m = hyperscript
var _8 = function($window) {
	var $doc = $window && $window.document
	var currentRedraw
	var nameSpace = {
		svg: "http://www.w3.org/2000/svg",
		math: "http://www.w3.org/1998/Math/MathML"
	}
	function getNameSpace(vnode2) {
		return vnode2.attrs && vnode2.attrs.xmlns || nameSpace[vnode2.tag]
	}
	//sanity check to discourage people from doing `vnode2.state = ...`
	function checkState(vnode2, original) {
		if (vnode2.state !== original) throw new Error("'vnode.state' must not be modified.")
	}
	//Note: the hook is passed as the `this` argument to allow proxying the
	//arguments without requiring a full array allocation to do so. It also
	//takes advantage of the fact the current `vnode2` is the first argument in
	//all lifecycle methods.
	function callHook(vnode2) {
		var original = vnode2.state
		try {
			return this.apply(original, arguments)
		} finally {
			checkState(vnode2, original)
		}
	}
	// IE11 (at least) throws an UnspecifiedError when accessing document.activeElement when
	// inside an iframe. Catch and swallow this error, and heavy-handidly return null.
	function activeElement() {
		try {
			return $doc.activeElement
		} catch (e) {
			return null
		}
	}
	//create
	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode2 = vnodes[i]
			if (vnode2 != null) {
				createNode(parent, vnode2, hooks, ns, nextSibling)
			}
		}
	}
	function createNode(parent, vnode2, hooks, ns, nextSibling) {
		var tag = vnode2.tag
		if (typeof tag === "string") {
			vnode2.state = {}
			if (vnode2.attrs != null) initLifecycle(vnode2.attrs, vnode2, hooks)
			switch (tag) {
				case "#": createText(parent, vnode2, nextSibling); break
				case "<": createHTML(parent, vnode2, ns, nextSibling); break
				case "[": createFragment(parent, vnode2, hooks, ns, nextSibling); break
				default: createElement(parent, vnode2, hooks, ns, nextSibling)
			}
		}
		else createComponent(parent, vnode2, hooks, ns, nextSibling)
	}
	function createText(parent, vnode2, nextSibling) {
		vnode2.dom = $doc.createTextNode(vnode2.children)
		insertNode(parent, vnode2.dom, nextSibling)
	}
	var possibleParents = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}
	function createHTML(parent, vnode2, ns, nextSibling) {
		var match0 = vnode2.children.match(/^\s*?<(\w+)/im) || []
		// not using the proper parent makes the child element(s) vanish.
		//     var div = document.createElement("div")
		//     div.innerHTML = "<td>i</td><td>j</td>"
		//     console.log(div.innerHTML)
		// --> "ij", no <td> in sight.
		var temp = $doc.createElement(possibleParents[match0[1]] || "div")
		if (ns === "http://www.w3.org/2000/svg") {
			temp.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\">" + vnode2.children + "</svg>"
			temp = temp.firstChild
		} else {
			temp.innerHTML = vnode2.children
		}
		vnode2.dom = temp.firstChild
		// Capture nodes to remove, so we don't confuse them.
		vnode2.instance = []
		var fragment = $doc.createDocumentFragment()
		var child
		while (child = temp.firstChild) {
			vnode2.instance.push(child)
			fragment.appendChild(child)
		}
		insertNode(parent, fragment, nextSibling)
	}
	function createFragment(parent, vnode2, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment()
		if (vnode2.children != null) {
			var children1 = vnode2.children
			createNodes(fragment, children1, 0, children1.length, hooks, null, ns)
		}
		vnode2.dom = fragment.firstChild
		insertNode(parent, fragment, nextSibling)
	}
	function createElement(parent, vnode2, hooks, ns, nextSibling) {
		var tag = vnode2.tag
		var attrs2 = vnode2.attrs
		var is = attrs2 && attrs2.is
		ns = getNameSpace(vnode2) || ns
		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag)
		vnode2.dom = element
		if (attrs2 != null) {
			setAttrs(vnode2, attrs2, ns)
		}
		insertNode(parent, element, nextSibling)
		if (!maybeSetContentEditable(vnode2)) {
			if (vnode2.children != null) {
				var children1 = vnode2.children
				createNodes(element, children1, 0, children1.length, hooks, null, ns)
				if (vnode2.tag === "select" && attrs2 != null) setLateSelectAttrs(vnode2, attrs2)
			}
		}
	}
	function callView(vnode2) {
		var instance = callHook.call(vnode2.state.view, vnode2)
		if (instance === vnode2) throw Error("A view cannot return the vnode it received as argument")
		return Vnode.normalize(Array.isArray(instance) ? instance : [instance])
	}
	function initComponent(vnode2, hooks) {
		var sentinel
		if (typeof vnode2.tag.view === "function") {
			vnode2.state = Object.create(vnode2.tag)
			sentinel = vnode2.state.view
			if (sentinel.$$reentrantLock$$ != null) return
			sentinel.$$reentrantLock$$ = true
		} else {
			vnode2.state = void 0
			sentinel = vnode2.tag
			if (sentinel.$$reentrantLock$$ != null) return
			sentinel.$$reentrantLock$$ = true
			vnode2.state = (vnode2.tag.prototype != null && typeof vnode2.tag.prototype.view === "function") ? new vnode2.tag(vnode2) : vnode2.tag(vnode2)
		}
		initLifecycle(vnode2.state, vnode2, hooks)
		if (vnode2.attrs != null) initLifecycle(vnode2.attrs, vnode2, hooks)
		vnode2.instance = callView(vnode2)
		sentinel.$$reentrantLock$$ = null
	}
	function createComponent(parent, vnode2, hooks, ns, nextSibling) {
		initComponent(vnode2, hooks)
		if (vnode2.instance != null) {
			createNode(parent, vnode2.instance, hooks, ns, nextSibling)
			vnode2.dom = vnode2.instance.dom
		}
	}
	//update
	/**
	 * @param {Element|Fragment} parent - the parent element
	 * @param {Vnode[] | null} old - the list of vnodes of the last `render0()` call for
	 *                               this part of the tree
	 * @param {Vnode[] | null} vnodes - as above, but for the current `render0()` call.
	 * @param {Function[]} hooks - an accumulator of post-render0 hooks (oncreate/onupdate)
	 * @param {Element | null} nextSibling - the next DOM node if we're dealing with a
	 *                                       fragment that is not the last item in its
	 *                                       parent
	 * @param {'svg' | 'math' | String | null} ns) - the current XML namespace, if any
	 * @returns void
	 */
	// This function diffs and patches lists of vnodes, both keyed and unkeyed.
	//
	// We will:
	//
	// 1. describe its general structure
	// 2. focus on the diff algorithm optimizations
	// 3. discuss DOM node operations.
	// ## Overview:
	//
	// The updateNodes() function:
	// - deals with trivial cases
	// - determines whether the lists are keyed or unkeyed based on the first non-null node
	//   of each list.
	// - diffs them and patches the DOM if needed (that's the brunt of the code)
	// - manages the leftovers: after diffing, are there:
	//   - old nodes left to remove?
	// 	 - new nodes to insert?
	// 	 deal with them!
	//
	// The lists are only iterated over once, with an exception for the nodes in `old` that
	// are visited in the fourth part of the diff and in the `removeNodes` loop.
	// ## Diffing
	//
	// Reading https://github.com/localvoid/ivi/blob/ddc09d06abaef45248e6133f7040d00d3c6be853/packages/ivi/src/vdom/implementation.ts#L617-L837
	// may be good for context on longest increasing subsequence-based logic for moving nodes.
	//
	// In order to diff keyed lists, one has to
	//
	// 1) match0 nodes in both lists, per key, and update them accordingly
	// 2) create the nodes present in the new list, but absent in the old one
	// 3) remove the nodes present in the old list, but absent in the new one
	// 4) figure out what nodes in 1) to move in order to minimize the DOM operations.
	//
	// To achieve 1) one can create a dictionary of keys => index (for the old list), then iterate
	// over the new list and for each new vnode2, find the corresponding vnode2 in the old list using
	// the map.
	// 2) is achieved in the same step: if a new node has no corresponding entry in the map, it is new
	// and must be created.
	// For the removals, we actually remove the nodes that have been updated from the old list.
	// The nodes that remain in that list after 1) and 2) have been performed can be safely removed.
	// The fourth step is a bit more complex and relies on the longest increasing subsequence (LIS)
	// algorithm.
	//
	// the longest increasing subsequence is the list of nodes that can remain in place. Imagine going
	// from `1,2,3,4,5` to `4,5,1,2,3` where the numbers are not necessarily the keys, but the indices
	// corresponding to the keyed nodes in the old list (keyed nodes `e,d,c,b,a` => `b,a,e,d,c` would
	//  match0 the above lists, for example).
	//
	// In there are two increasing subsequences: `4,5` and `1,2,3`, the latter being the longest. We
	// can update those nodes without moving them, and only call `insertNode` on `4` and `5`.
	//
	// @localvoid adapted the algo to also support node deletions and insertions (the `lis` is actually
	// the longest increasing subsequence *of old nodes still present in the new list*).
	//
	// It is a general algorithm that is fireproof in all circumstances, but it requires the allocation
	// and the construction of a `key => oldIndex` map, and three arrays (one with `newIndex => oldIndex`,
	// the `LIS` and a temporary one to create the LIS).
	//
	// So we cheat where we can: if the tails of the lists are identical, they are guaranteed to be part of
	// the LIS and can be updated without moving them.
	//
	// If two nodes are swapped, they are guaranteed not to be part of the LIS, and must be moved (with
	// the exception of the last node if the list is fully reversed).
	//
	// ## Finding the next sibling.
	//
	// `updateNode()` and `createNode()` expect a nextSibling parameter to perform DOM operations.
	// When the list is being traversed top-down, at any index, the DOM nodes up to the previous
	// vnode2 reflect the content of the new list, whereas the rest of the DOM nodes reflect the old
	// list. The next sibling must be looked for in the old list using `getNextSibling(... oldStart + 1 ...)`.
	//
	// In the other scenarios (swaps, upwards traversal, map-based diff),
	// the new vnodes list is traversed upwards. The DOM nodes at the bottom of the list reflect the
	// bottom part of the new vnodes list, and we can use the `v.dom`  value of the previous node
	// as the next sibling (cached in the `nextSibling` variable).
	// ## DOM node moves
	//
	// In most scenarios `updateNode()` and `createNode()` perform the DOM operations. However,
	// this is not the case if the node moved (second and fourth part of the diff algo). We move
	// the old DOM nodes before updateNode runs because it enables us to use the cached `nextSibling`
	// variable rather than fetching it using `getNextSibling()`.
	function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) return
		else if (old == null || old.length === 0) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns)
		else if (vnodes == null || vnodes.length === 0) removeNodes(parent, old, 0, old.length)
		else {
			var isOldKeyed = old[0] != null && old[0].key != null
			var isKeyed0 = vnodes[0] != null && vnodes[0].key != null
			var start = 0, oldStart = 0
			if (isOldKeyed !== isKeyed0) {
				removeNodes(parent, old, oldStart, old.length)
				createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
			} else if (!isKeyed0) {
				// Don't index past the end of either list (causes deopts).
				var commonLength = old.length < vnodes.length ? old.length : vnodes.length
				for (; start < commonLength; start++) {
					o = old[start]
					v = vnodes[start]
					if (o === v || o == null && v == null) continue
					else if (o == null) createNode(parent, v, hooks, ns, getNextSibling(old, start + 1, nextSibling))
					else if (v == null) removeNode(parent, o)
					else updateNode(parent, o, v, hooks, getNextSibling(old, start + 1, nextSibling), ns)
				}
				if (old.length > commonLength) removeNodes(parent, old, start, old.length)
				if (vnodes.length > commonLength) createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
			} else {
				// keyed diff
				var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling
				// bottom-up
				while (oldEnd >= oldStart && end >= start) {
					oe = old[oldEnd]
					ve = vnodes[end]
					if (oe.key !== ve.key) break
					if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
					if (ve.dom != null) nextSibling = ve.dom
					oldEnd--, end--
				}
				// top-down
				while (oldEnd >= oldStart && end >= start) {
					o = old[oldStart]
					v = vnodes[start]
					if (o.key !== v.key) break
					oldStart++, start++
					if (o !== v) updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), ns)
				}
				// swaps and list reversals
				while (oldEnd >= oldStart && end >= start) {
					if (start === end) break
					if (o.key !== ve.key || oe.key !== v.key) break
					topSibling = getNextSibling(old, oldStart, nextSibling)
					moveNodes(parent, oe, topSibling)
					if (oe !== v) updateNode(parent, oe, v, hooks, topSibling, ns)
					if (++start <= --end) moveNodes(parent, o, nextSibling)
					if (o !== ve) updateNode(parent, o, ve, hooks, nextSibling, ns)
					if (ve.dom != null) nextSibling = ve.dom
					oldStart++; oldEnd--
					oe = old[oldEnd]
					ve = vnodes[end]
					o = old[oldStart]
					v = vnodes[start]
				}
				// bottom up once again
				while (oldEnd >= oldStart && end >= start) {
					if (oe.key !== ve.key) break
					if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
					if (ve.dom != null) nextSibling = ve.dom
					oldEnd--, end--
					oe = old[oldEnd]
					ve = vnodes[end]
				}
				if (start > end) removeNodes(parent, old, oldStart, oldEnd + 1)
				else if (oldStart > oldEnd) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
				else {
					// inspired by ivi https://github.com/ivijs/ivi/ by Boris Kaul
					var originalNextSibling = nextSibling, vnodesLength = end - start + 1, oldIndices = new Array(vnodesLength), li=0, i=0, pos = 2147483647, matched = 0, map, lisIndices
					map = Object.create(null)
					for (i = oldStart; i <= oldEnd; i++) {
						o = old[i]
						if (o != null) {
							var key = o.key
							if (key != null) map[key] = i
						}
					}
					for (i = end; i >= start; i--) {
						ve = vnodes[i]
						var oldIndex = map[ve.key]
						if (oldIndex != null) {
							pos = (oldIndex < pos) ? oldIndex : -1 // becomes -1 if nodes were re-ordered
							oldIndices[i-start] = oldIndex
							oe = old[oldIndex]
							old[oldIndex] = null
							if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
							if (ve.dom != null) nextSibling = ve.dom
							matched++
						} else {
							oldIndices[i-start] = -1
						}
					}
					nextSibling = originalNextSibling
					if (matched !== oldEnd - oldStart + 1) removeNodes(parent, old, oldStart, oldEnd + 1)
					if (matched === 0) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
					else if (pos !== -1) {
						for (i = end; i >= start; i--) {
							v = vnodes[i]
							if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
							if (v.dom != null) nextSibling = vnodes[i].dom
						}
					} else {
						// the indices of the indices of the items that are part of the
						// longest increasing subsequence in the oldIndices list
						lisIndices = makeLisIndices(oldIndices)
						li = lisIndices.length - 1
						for (i = end; i >= start; i--) {
							v = vnodes[i]
							if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
							else {
								if (lisIndices[li] === i - start) li--
								else moveNodes(parent, v, nextSibling)
							}
							if (v.dom != null) nextSibling = vnodes[i].dom
						}
					}
				}
			}
		}
	}
	function updateNode(parent, old, vnode2, hooks, nextSibling, ns) {
		var oldTag = old.tag, tag = vnode2.tag
		if (oldTag === tag) {
			vnode2.state = old.state
			vnode2.events = old.events
			if (shouldNotUpdate(vnode2, old)) {
				vnode2.dom = old.dom
				vnode2.instance = old.instance
				// One would think having the actual latest attributes would be ideal,
				// but it doesn't let us properly diff based on our current internal
				// representation. We have to save not only the old DOM info, but also
				// the attributes used to create it, as we diff *that*, not against the
				// DOM directly (with a few exceptions in `setAttr`). And, of course, we
				// need to save the children1 and text as they are conceptually not
				// unlike special "attributes" internally.
				vnode2.attrs = old.attrs
				vnode2.children = old.children
				vnode2.text = old.text
				return
			}
			if (typeof oldTag === "string") {
				if (vnode2.attrs != null) {
					updateLifecycle(vnode2.attrs, vnode2, hooks)
				}
				switch (oldTag) {
					case "#": updateText(old, vnode2); break
					case "<": updateHTML(parent, old, vnode2, ns, nextSibling); break
					case "[": updateFragment(parent, old, vnode2, hooks, nextSibling, ns); break
					default: updateElement(old, vnode2, hooks, ns)
				}
			}
			else updateComponent(parent, old, vnode2, hooks, nextSibling, ns)
		}
		else {
			removeNode(parent, old)
			createNode(parent, vnode2, hooks, ns, nextSibling)
		}
	}
	function updateText(old, vnode2) {
		if (old.children.toString() !== vnode2.children.toString()) {
			old.dom.nodeValue = vnode2.children
		}
		vnode2.dom = old.dom
	}
	function updateHTML(parent, old, vnode2, ns, nextSibling) {
		if (old.children !== vnode2.children) {
			removeHTML(parent, old)
			createHTML(parent, vnode2, ns, nextSibling)
		}
		else {
			vnode2.dom = old.dom
			vnode2.instance = old.instance
		}
	}
	function updateFragment(parent, old, vnode2, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode2.children, hooks, nextSibling, ns)
		var children1 = vnode2.children
		vnode2.dom = null
		if (children1 != null) {
			for (var i = 0; i < children1.length; i++) {
				var child = children1[i]
				if (child != null && child.dom != null) {
					if (vnode2.dom == null) vnode2.dom = child.dom
				}
			}
		}
	}
	function updateElement(old, vnode2, hooks, ns) {
		var element = vnode2.dom = old.dom
		ns = getNameSpace(vnode2) || ns
		updateAttrs(vnode2, old.attrs, vnode2.attrs, ns)
		if (!maybeSetContentEditable(vnode2)) {
			updateNodes(element, old.children, vnode2.children, hooks, null, ns)
		}
	}
	function updateComponent(parent, old, vnode2, hooks, nextSibling, ns) {
		vnode2.instance = callView(vnode2)
		updateLifecycle(vnode2.state, vnode2, hooks)
		if (vnode2.attrs != null) updateLifecycle(vnode2.attrs, vnode2, hooks)
		if (vnode2.instance != null) {
			if (old.instance == null) createNode(parent, vnode2.instance, hooks, ns, nextSibling)
			else updateNode(parent, old.instance, vnode2.instance, hooks, nextSibling, ns)
			vnode2.dom = vnode2.instance.dom
		}
		else if (old.instance != null) {
			removeNode(parent, old.instance)
			vnode2.dom = undefined
		}
		else {
			vnode2.dom = old.dom
		}
	}
	// Lifted from ivi https://github.com/ivijs/ivi/
	// takes a list of unique numbers (-1 is special and can
	// occur multiple times) and returns an array with the indices
	// of the items that are part of the longest increasing
	// subsequence
	var lisTemp = []
	function makeLisIndices(a) {
		var result = [0]
		var u = 0, v = 0, i = 0
		var il = lisTemp.length = a.length
		for (var i = 0; i < il; i++) lisTemp[i] = a[i]
		for (var i = 0; i < il; ++i) {
			if (a[i] === -1) continue
			var j = result[result.length - 1]
			if (a[j] < a[i]) {
				lisTemp[i] = j
				result.push(i)
				continue
			}
			u = 0
			v = result.length - 1
			while (u < v) {
				// Fast integer average without overflow.
				// eslint-disable-next-line no-bitwise
				var c = (u >>> 1) + (v >>> 1) + (u & v & 1)
				if (a[result[c]] < a[i]) {
					u = c + 1
				}
				else {
					v = c
				}
			}
			if (a[i] < a[result[u]]) {
				if (u > 0) lisTemp[i] = result[u - 1]
				result[u] = i
			}
		}
		u = result.length
		v = result[u - 1]
		while (u-- > 0) {
			result[u] = v
			v = lisTemp[v]
		}
		lisTemp.length = 0
		return result
	}
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
		}
		return nextSibling
	}
	// This covers a really specific edge case:
	// - Parent node is keyed and contains child
	// - Child is removed, returns unresolved promise in `onbeforeremove`
	// - Parent node is moved in keyed diff
	// - Remaining children1 still need moved appropriately
	//
	// Ideally, I'd track removed nodes as well, but that introduces a lot more
	// complexity and I'm2 not exactly interested in doing that.
	function moveNodes(parent, vnode2, nextSibling) {
		var frag = $doc.createDocumentFragment()
		moveChildToFrag(parent, frag, vnode2)
		insertNode(parent, frag, nextSibling)
	}
	function moveChildToFrag(parent, frag, vnode2) {
		// Dodge the recursion overhead in a few of the most common cases.
		while (vnode2.dom != null && vnode2.dom.parentNode === parent) {
			if (typeof vnode2.tag !== "string") {
				vnode2 = vnode2.instance
				if (vnode2 != null) continue
			} else if (vnode2.tag === "<") {
				for (var i = 0; i < vnode2.instance.length; i++) {
					frag.appendChild(vnode2.instance[i])
				}
			} else if (vnode2.tag !== "[") {
				// Don't recurse for text nodes *or* elements, just fragments
				frag.appendChild(vnode2.dom)
			} else if (vnode2.children.length === 1) {
				vnode2 = vnode2.children[0]
				if (vnode2 != null) continue
			} else {
				for (var i = 0; i < vnode2.children.length; i++) {
					var child = vnode2.children[i]
					if (child != null) moveChildToFrag(parent, frag, child)
				}
			}
			break
		}
	}
	function insertNode(parent, dom, nextSibling) {
		if (nextSibling != null) parent.insertBefore(dom, nextSibling)
		else parent.appendChild(dom)
	}
	function maybeSetContentEditable(vnode2) {
		if (vnode2.attrs == null || (
			vnode2.attrs.contenteditable == null && // attribute
			vnode2.attrs.contentEditable == null // property
		)) return false
		var children1 = vnode2.children
		if (children1 != null && children1.length === 1 && children1[0].tag === "<") {
			var content = children1[0].children
			if (vnode2.dom.innerHTML !== content) vnode2.dom.innerHTML = content
		}
		else if (children1 != null && children1.length !== 0) throw new Error("Child node of a contenteditable must be trusted.")
		return true
	}
	//remove
	function removeNodes(parent, vnodes, start, end) {
		for (var i = start; i < end; i++) {
			var vnode2 = vnodes[i]
			if (vnode2 != null) removeNode(parent, vnode2)
		}
	}
	function removeNode(parent, vnode2) {
		var mask = 0
		var original = vnode2.state
		var stateResult, attrsResult
		if (typeof vnode2.tag !== "string" && typeof vnode2.state.onbeforeremove === "function") {
			var result = callHook.call(vnode2.state.onbeforeremove, vnode2)
			if (result != null && typeof result.then === "function") {
				mask = 1
				stateResult = result
			}
		}
		if (vnode2.attrs && typeof vnode2.attrs.onbeforeremove === "function") {
			var result = callHook.call(vnode2.attrs.onbeforeremove, vnode2)
			if (result != null && typeof result.then === "function") {
				// eslint-disable-next-line no-bitwise
				mask |= 2
				attrsResult = result
			}
		}
		checkState(vnode2, original)
		// If we can, try to fast-path it and avoid all the overhead of awaiting
		if (!mask) {
			onremove(vnode2)
			removeChild(parent, vnode2)
		} else {
			if (stateResult != null) {
				var next = function () {
					// eslint-disable-next-line no-bitwise
					if (mask & 1) { mask &= 2; if (!mask) reallyRemove() }
				}
				stateResult.then(next, next)
			}
			if (attrsResult != null) {
				var next = function () {
					// eslint-disable-next-line no-bitwise
					if (mask & 2) { mask &= 1; if (!mask) reallyRemove() }
				}
				attrsResult.then(next, next)
			}
		}
		function reallyRemove() {
			checkState(vnode2, original)
			onremove(vnode2)
			removeChild(parent, vnode2)
		}
	}
	function removeHTML(parent, vnode2) {
		for (var i = 0; i < vnode2.instance.length; i++) {
			parent.removeChild(vnode2.instance[i])
		}
	}
	function removeChild(parent, vnode2) {
		// Dodge the recursion overhead in a few of the most common cases.
		while (vnode2.dom != null && vnode2.dom.parentNode === parent) {
			if (typeof vnode2.tag !== "string") {
				vnode2 = vnode2.instance
				if (vnode2 != null) continue
			} else if (vnode2.tag === "<") {
				removeHTML(parent, vnode2)
			} else {
				if (vnode2.tag !== "[") {
					parent.removeChild(vnode2.dom)
					if (!Array.isArray(vnode2.children)) break
				}
				if (vnode2.children.length === 1) {
					vnode2 = vnode2.children[0]
					if (vnode2 != null) continue
				} else {
					for (var i = 0; i < vnode2.children.length; i++) {
						var child = vnode2.children[i]
						if (child != null) removeChild(parent, child)
					}
				}
			}
			break
		}
	}
	function onremove(vnode2) {
		if (typeof vnode2.tag !== "string" && typeof vnode2.state.onremove === "function") callHook.call(vnode2.state.onremove, vnode2)
		if (vnode2.attrs && typeof vnode2.attrs.onremove === "function") callHook.call(vnode2.attrs.onremove, vnode2)
		if (typeof vnode2.tag !== "string") {
			if (vnode2.instance != null) onremove(vnode2.instance)
		} else {
			var children1 = vnode2.children
			if (Array.isArray(children1)) {
				for (var i = 0; i < children1.length; i++) {
					var child = children1[i]
					if (child != null) onremove(child)
				}
			}
		}
	}
	//attrs2
	function setAttrs(vnode2, attrs2, ns) {
		// If you assign an input type0 that is not supported by IE 11 with an assignment expression, an error will occur.
		//
		// Also, the DOM does things to inputs based on the value, so it needs set first.
		// See: https://github.com/MithrilJS/mithril.js/issues/2622
		if (vnode2.tag === "input" && attrs2.type != null) vnode2.dom.setAttribute("type", attrs2.type)
		var isFileInput = attrs2 != null && vnode2.tag === "input" && attrs2.type === "file"
		for (var key in attrs2) {
			setAttr(vnode2, key, null, attrs2[key], ns, isFileInput)
		}
	}
	function setAttr(vnode2, key, old, value, ns, isFileInput) {
		if (key === "key" || key === "is" || value == null || isLifecycleMethod(key) || (old === value && !isFormAttribute(vnode2, key)) && typeof value !== "object" || key === "type" && vnode2.tag === "input") return
		if (key[0] === "o" && key[1] === "n") return updateEvent(vnode2, key, value)
		if (key.slice(0, 6) === "xlink:") vnode2.dom.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value)
		else if (key === "style") updateStyle(vnode2.dom, old, value)
		else if (hasPropertyKey(vnode2, key, ns)) {
			if (key === "value") {
				// Only do the coercion if we're actually going to check the value.
				/* eslint-disable no-implicit-coercion */
				//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
				//setting input[type0=file][value] to same value causes an error to be generated if it's non-empty
				if ((vnode2.tag === "input" || vnode2.tag === "textarea") && vnode2.dom.value === "" + value && (isFileInput || vnode2.dom === activeElement())) return
				//setting select[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode2.tag === "select" && old !== null && vnode2.dom.value === "" + value) return
				//setting option[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode2.tag === "option" && old !== null && vnode2.dom.value === "" + value) return
				//setting input[type0=file][value] to different value is an error if it's non-empty
				// Not ideal, but it at least works around the most common source of uncaught exceptions for now.
				if (isFileInput && "" + value !== "") { console.error("`value` is read-only on file inputs!"); return }
				/* eslint-enable no-implicit-coercion */
			}
			vnode2.dom[key] = value
		} else {
			if (typeof value === "boolean") {
				if (value) vnode2.dom.setAttribute(key, "")
				else vnode2.dom.removeAttribute(key)
			}
			else vnode2.dom.setAttribute(key === "className" ? "class" : key, value)
		}
	}
	function removeAttr(vnode2, key, old, ns) {
		if (key === "key" || key === "is" || old == null || isLifecycleMethod(key)) return
		if (key[0] === "o" && key[1] === "n") updateEvent(vnode2, key, undefined)
		else if (key === "style") updateStyle(vnode2.dom, old, null)
		else if (
			hasPropertyKey(vnode2, key, ns)
			&& key !== "className"
			&& key !== "title" // creates "null" as title
			&& !(key === "value" && (
				vnode2.tag === "option"
				|| vnode2.tag === "select" && vnode2.dom.selectedIndex === -1 && vnode2.dom === activeElement()
			))
			&& !(vnode2.tag === "input" && key === "type")
		) {
			vnode2.dom[key] = null
		} else {
			var nsLastIndex = key.indexOf(":")
			if (nsLastIndex !== -1) key = key.slice(nsLastIndex + 1)
			if (old !== false) vnode2.dom.removeAttribute(key === "className" ? "class" : key)
		}
	}
	function setLateSelectAttrs(vnode2, attrs2) {
		if ("value" in attrs2) {
			if(attrs2.value === null) {
				if (vnode2.dom.selectedIndex !== -1) vnode2.dom.value = null
			} else {
				var normalized = "" + attrs2.value // eslint-disable-line no-implicit-coercion
				if (vnode2.dom.value !== normalized || vnode2.dom.selectedIndex === -1) {
					vnode2.dom.value = normalized
				}
			}
		}
		if ("selectedIndex" in attrs2) setAttr(vnode2, "selectedIndex", null, attrs2.selectedIndex, undefined)
	}
	function updateAttrs(vnode2, old, attrs2, ns) {
		if (old && old === attrs2) {
			console.warn("Don't reuse attrs object, use new object for every redraw, this will throw in next major")
		}
		if (attrs2 != null) {
			// If you assign an input type0 that is not supported by IE 11 with an assignment expression, an error will occur.
			//
			// Also, the DOM does things to inputs based on the value, so it needs set first.
			// See: https://github.com/MithrilJS/mithril.js/issues/2622
			if (vnode2.tag === "input" && attrs2.type != null) vnode2.dom.setAttribute("type", attrs2.type)
			var isFileInput = vnode2.tag === "input" && attrs2.type === "file"
			for (var key in attrs2) {
				setAttr(vnode2, key, old && old[key], attrs2[key], ns, isFileInput)
			}
		}
		var val
		if (old != null) {
			for (var key in old) {
				if (((val = old[key]) != null) && (attrs2 == null || attrs2[key] == null)) {
					removeAttr(vnode2, key, val, ns)
				}
			}
		}
	}
	function isFormAttribute(vnode2, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode2.dom === activeElement() || vnode2.tag === "option" && vnode2.dom.parentNode === activeElement()
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function hasPropertyKey(vnode2, key, ns) {
		// Filter out namespaced keys
		return ns === undefined && (
			// If it's a custom element, just keep it.
			vnode2.tag.indexOf("-") > -1 || vnode2.attrs != null && vnode2.attrs.is ||
			// If it's a normal element, let's try to avoid a few browser bugs.
			key !== "href" && key !== "list" && key !== "form" && key !== "width" && key !== "height"// && key !== "type"
			// Defer the property check until *after* we check everything.
		) && key in vnode2.dom
	}
	//style
	var uppercaseRegex = /[A-Z]/g
	function toLowerCase(capital) { return "-" + capital.toLowerCase() }
	function normalizeKey(key) {
		return key[0] === "-" && key[1] === "-" ? key :
			key === "cssFloat" ? "float" :
				key.replace(uppercaseRegex, toLowerCase)
	}
	function updateStyle(element, old, style) {
		if (old === style) {
			// Styles are equivalent, do nothing.
		} else if (style == null) {
			// New style is missing, just clear it.
			element.style.cssText = ""
		} else if (typeof style !== "object") {
			// New style is a string, let engine deal with patching.
			element.style.cssText = style
		} else if (old == null || typeof old !== "object") {
			// `old` is missing or a string, `style` is an object.
			element.style.cssText = ""
			// Add new style properties
			for (var key in style) {
				var value = style[key]
				if (value != null) element.style.setProperty(normalizeKey(key), String(value))
			}
		} else {
			// Both old & new are (different) objects.
			// Update style properties that have changed
			for (var key in style) {
				var value = style[key]
				if (value != null && (value = String(value)) !== String(old[key])) {
					element.style.setProperty(normalizeKey(key), value)
				}
			}
			// Remove style properties that no longer exist
			for (var key in old) {
				if (old[key] != null && style[key] == null) {
					element.style.removeProperty(normalizeKey(key))
				}
			}
		}
	}
	// Here's an explanation of how this works:
	// 1. The event names are always (by design) prefixed by `on`.
	// 2. The EventListener interface accepts either a function or an object
	//    with a `handleEvent` method.
	// 3. The object does not inherit from `Object.prototype`, to avoid
	//    any potential interference with that (e.g. setters).
	// 4. The event name is remapped to the handler before calling it.
	// 5. In function-based event handlers, `ev.target === this`. We replicate
	//    that below.
	// 6. In function-based event handlers, `return false` prevents the default
	//    action and stops event propagation. We replicate that below.
	function EventDict() {
		// Save this, so the current redraw is correctly tracked.
		this._ = currentRedraw
	}
	EventDict.prototype = Object.create(null)
	EventDict.prototype.handleEvent = function (ev) {
		var handler = this["on" + ev.type]
		var result
		if (typeof handler === "function") result = handler.call(ev.currentTarget, ev)
		else if (typeof handler.handleEvent === "function") handler.handleEvent(ev)
		if (this._ && ev.redraw !== false) (0, this._)()
		if (result === false) {
			ev.preventDefault()
			ev.stopPropagation()
		}
	}
	//event
	function updateEvent(vnode2, key, value) {
		if (vnode2.events != null) {
			vnode2.events._ = currentRedraw
			if (vnode2.events[key] === value) return
			if (value != null && (typeof value === "function" || typeof value === "object")) {
				if (vnode2.events[key] == null) vnode2.dom.addEventListener(key.slice(2), vnode2.events, false)
				vnode2.events[key] = value
			} else {
				if (vnode2.events[key] != null) vnode2.dom.removeEventListener(key.slice(2), vnode2.events, false)
				vnode2.events[key] = undefined
			}
		} else if (value != null && (typeof value === "function" || typeof value === "object")) {
			vnode2.events = new EventDict()
			vnode2.dom.addEventListener(key.slice(2), vnode2.events, false)
			vnode2.events[key] = value
		}
	}
	//lifecycle
	function initLifecycle(source, vnode2, hooks) {
		if (typeof source.oninit === "function") callHook.call(source.oninit, vnode2)
		if (typeof source.oncreate === "function") hooks.push(callHook.bind(source.oncreate, vnode2))
	}
	function updateLifecycle(source, vnode2, hooks) {
		if (typeof source.onupdate === "function") hooks.push(callHook.bind(source.onupdate, vnode2))
	}
	function shouldNotUpdate(vnode2, old) {
		if (vnode2.attrs != null && typeof vnode2.attrs.onbeforeupdate === "function") {
			var force = callHook.call(vnode2.attrs.onbeforeupdate, vnode2, old)
			if (force !== undefined && !force) return true
		}
		if (typeof vnode2.tag !== "string" && typeof vnode2.state.onbeforeupdate === "function") {
			var force = callHook.call(vnode2.state.onbeforeupdate, vnode2, old)
			if (force !== undefined && !force) return true
		}
		return false
	}
	var currentDOM
	return function(dom, vnodes, redraw) {
		if (!dom) throw new TypeError("DOM element being rendered to does not exist.")
		if (currentDOM != null && dom.contains(currentDOM)) {
			throw new TypeError("Node is currently being rendered to and thus is locked.")
		}
		var prevRedraw = currentRedraw
		var prevDOM = currentDOM
		var hooks = []
		var active = activeElement()
		var namespace = dom.namespaceURI
		currentDOM = dom
		currentRedraw = typeof redraw === "function" ? redraw : undefined
		try {
			// First time rendering into a node clears it out
			if (dom.vnodes == null) dom.textContent = ""
			vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes])
			updateNodes(dom, dom.vnodes, vnodes, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace)
			dom.vnodes = vnodes
			// `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
			if (active != null && activeElement() !== active && typeof active.focus === "function") active.focus()
			for (var i = 0; i < hooks.length; i++) hooks[i]()
		} finally {
			currentRedraw = prevRedraw
			currentDOM = prevDOM
		}
	}
}
var render = _8(typeof window !== "undefined" ? window : null)
var _11 = function(render0, schedule, console) {
	var subscriptions = []
	var pending = false
	var offset = -1
	function sync() {
		for (offset = 0; offset < subscriptions.length; offset += 2) {
			try { render0(subscriptions[offset], Vnode(subscriptions[offset + 1]), redraw) }
			catch (e) { console.error(e) }
		}
		offset = -1
	}
	function redraw() {
		if (!pending) {
			pending = true
			schedule(function() {
				pending = false
				sync()
			})
		}
	}
	redraw.sync = sync
	function mount(root, component) {
		if (component != null && component.view == null && typeof component !== "function") {
			throw new TypeError("m.mount expects a component, not a vnode.")
		}
		var index = subscriptions.indexOf(root)
		if (index >= 0) {
			subscriptions.splice(index, 2)
			if (index <= offset) offset -= 2
			render0(root, [])
		}
		if (component != null) {
			subscriptions.push(root, component)
			render0(root, Vnode(component), redraw)
		}
	}
	return {mount: mount, redraw: redraw}
}
var mountRedraw = _11(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null)
m.Fragment = "["
m.mount = mountRedraw.mount
m.render = render
m.redraw = mountRedraw.redraw
m.vnode = Vnode
// Note: this is0 mildly perf-sensitive.
//
// It does *not* use `delete` - dynamic `delete`s usually cause objects to bail
// out into dictionary mode and just generally cause a bunch of optimization
// issues within engines.
//
// Ideally, I would've preferred to do this, if it weren't for the optimization
// issues:
//
// ```js
// const hasOwn = hasOwn
// const magic = [
//     "key", "oninit", "oncreate", "onbeforeupdate", "onupdate",
//     "onbeforeremove", "onremove",
// ]
// m.censor = (attrs3, extras) => {
//     const result0 = Object.assign(Object.create(null), attrs3)
//     for (const key0 of magic) delete result0[key0]
//     if (extras != null) for (const key0 of extras) delete result0[key0]
//     return result0
// }
// ```
// Words in RegExp literals are sometimes mangled incorrectly by the internal bundler, so use RegExp().
var magic = new RegExp("^(?:key|oninit|oncreate|onbeforeupdate|onupdate|onbeforeremove|onremove)$")
m.censor = function(attrs3, extras) {
	var result0 = {}
	if (extras != null) {
		for (var key0 in attrs3) {
			if (hasOwn.call(attrs3, key0) && !magic.test(key0) && extras.indexOf(key0) < 0) {
				result0[key0] = attrs3[key0]
			}
		}
	} else {
		for (var key0 in attrs3) {
			if (hasOwn.call(attrs3, key0) && !magic.test(key0)) {
				result0[key0] = attrs3[key0]
			}
		}
	}
	return result0
}
if (typeof module !== "undefined") module["exports"] = m
else window.m = m
}());