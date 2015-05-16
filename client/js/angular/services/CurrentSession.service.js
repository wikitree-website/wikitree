(function() {
    angular.module('wikitree').

		factory('CurrentSession', ['Utilities', 'Articles', function(Utilities, Articles) {

			/**
			 * Models current Wikipedia map
			 *     - history:   prev/next stacks of visited nodes
			 *     - nodes:         nodes (with article and graph data)
			 *     - links:         links (with source and target nodes)
			 *     - callbacks: 	lists of update:<detail> callbacks
			 *
			 * Has a public interface for accepting update requests
			 * (handle title action, set current node)
			 *     1. updates internal data
			 *     2. broadcasts change event
			 *     3. external resources update themselves
			 *         - article reader
			 *         - force graph
			 *
			 */

			var history;
			var nodes;
			var links;


			/**
			 * Node history
			 */

			history = {
				currentId: undefined,
				prevStack: [],
				nextStack: [],
				setCurrentId: function (nodeId) {
					// make sure we're not already here
					if (history.currentId === nodeId) return null;
					// as with browser history,
					// when jumping to new page
					// add current to prev stack
					// and flush out next stack
					if (history.currentId) {
						history.prevStack.push(history.currentId);
					}
					history.nextStack = [];
					history.currentId = nodeId;
					return history.currentId;
				},
				goBackward: function () {
					if (!history.prevStack.length) return null;
					history.nextStack.push(history.currentId);
					history.currentId = history.prevStack.pop();
					return history.currentId;
				},
				goForward: function () {
					if (!history.nextStack.length) return null;
					history.prevStack.push(history.currentId);
					history.currentId = history.nextStack.pop();
					return history.currentId;
				},
				removeNode: function (nodeId) {

					// expunge from past & future
					history.prevStack = history.prevStack
						.filter(function (id) { return id !== nodeId });
					history.nextStack = history.nextStack
						.filter(function (id) { return id !== nodeId });

					// find a new current node
					if (history.prevStack.length) {
						// try previous first
						history.currentId = history.prevStack.pop();
					} else if (history.nextStack.length) {
						// how about next
						history.currentId = history.nextStack.pop();
					} else {
						// uh oh
						history.currentId = null;
					}

					// we did what we could
					return history.currentId;

				},
				exportState: function () {
					return {
						currentId: history.currentId,
						prevStack: history.prevStack,
						nextStack: history.nextStack
					}
				},
				importState: function (state) {
					history.prevStack = state.prevStack;
					history.nextStack = state.nextStack;
					history.currentId = state.currentId;
				},
				clearState: function () {
					history.currentId = undefined;
					history.prevStack = [];
					history.nextStack = [];
				}
			};


			/**
			 * Node collection
			 */

			function Node(args) {
				this.uuid = args.uuid || Utilities.makeUUID();
				this.title = args.title;
				// d3 force graph attributes
				// https://github.com/mbostock/d3/wiki/Force-Layout#nodes
				this.index = undefined; // the zero-based index of the node within the nodes array.
				this.x = undefined; // the x-coordinate of the current node position.
				this.y = undefined; // the y-coordinate of the current node position.
				this.px = undefined; // the x-coordinate of the previous node position.
				this.py = undefined; // the y-coordinate of the previous node position.
				this.fixed = undefined; // a boolean indicating whether node position is locked.
				this.weight = undefined; // the node weight; the number of associated links.
			}

			nodes = {
				arr: [],
				byId: {},
				byTitle: {},
				addNode: function (title) {
					var node = new Node({ title: title });
					nodes.arr.push(node);
					nodes.byId[node.uuid] = node;
					nodes.byTitle[node.title] = node;
					return node;
				},
				removeNode: function (nodeId) {
					var node = nodes.byId[nodeId];
					if (!node) return null;
					nodes.arr = nodes.arr.filter(function (n) { return n.uuid !== node.uuid });
					delete nodes.byId[node.uuid];
					delete nodes.byTitle[node.title];
					return node;
				},
				exportState: function () {
					return {
						arr: nodes.arr
					}
				},
				importState: function (state) {
					nodes.arr = state.arr;
					nodes.byId = {};
					nodes.byTitle = {};
					nodes.arr.forEach(function (node) {
						nodes.byId[node.uuid] = node;
						nodes.byTitle[node.title] = node;
					});
				},
				clearState: function () {
					nodes.arr = [];
					nodes.byId = {};
					nodes.byTitle = {};
				}
			};


			/**
			 * Link collection
			 */

			function Link(args) {
				this.uuid = args.uuid || Utilities.makeUUID();
				this.sourceId = args.sourceId;
				this.targetId = args.targetId;
				this.linkback = false;
				// d3 force graph attributes
				// https://github.com/mbostock/d3/wiki/Force-Layout#links
				this.source = nodes.byId[this.sourceId];
				this.target = nodes.byId[this.targetId];
			}

			links = {
				arr: [],
				byId: {},
				byNodeIds: {},
				addLink: function (sourceId, targetId) {
					var link = new Link({
						sourceId: sourceId,
						targetId: targetId
					});
					links.arr.push(link);
					if (!links.byNodeIds[sourceId]) links.byNodeIds[sourceId] = {};
					links.byNodeIds[sourceId][targetId] = link;
					links.byId[link.uuid] = link;
					return link;
				},
				removeLink: function (sourceId, targetId) {
					var link = links.byNodeIds[sourceId][targetId];
					if (!link) return null;
					links.arr = links.arr.filter(function (l) { return l.uuid !== link.uuid });
					delete links.byNodeIds[sourceId][targetId];
					delete links.byId[link.uuid];
					return link;
				},
				removeByNode: function (nodeId) {

					// remove any links with node from array
					links.arr = links.arr.filter(function (link) {
						return link.sourceId !== nodeId && link.targetId !== nodeId
					});

					// remove any references by node id
					delete links.byNodeIds[nodeId];
					Object.keys(links.byNodeIds).forEach(function (sourceId) {
						delete links.byNodeIds[sourceId][nodeId];
					});

				},
				exportState: function () {
					return {
						arr: links.arr
					}
				},
				importState: function (state) {
					links.arr = state.arr;
					links.byId = {};
					links.byNodeIds = {};
					links.arr.forEach(function (link) {
						var sourceId = link.sourceId;
						var targetId = link.targetId;
						link.source = nodes.byId[sourceId];
						link.target = nodes.byId[targetId];
						links.byId[link.uuid] = link;
						if (!links.byNodeIds[sourceId]) links.byNodeIds[sourceId] = {};
						links.byNodeIds[sourceId][targetId] = link;
					});
				},
				clearState: function () {
					links.arr = [];
					links.byId = {};
					links.byNodeIds = {};
				}
			};


			/**
			 * Find or Add nest/chain
			 */

			function findOrAddArticle(title, callback) {
				Articles.getByUnsafeTitle(title).
					then(function (article) {
						callback(article);
					}).
					catch(function () {
						callback(null);
					});
			}

			function findOrAddNode(article, callback) {
				var node = nodes.byTitle[article.title];
				if (!node) node = nodes.addNode(article.title);
				callback(node);
			}

			function findOrAddLink(node, sourceId, callback) {
				var targetId = node.uuid;

				// wait lol, no self-referencing nodes
				if (targetId === sourceId) {
					callback(null);
					return;
				}

				// TODO not sure where to put this
				// give source coords to target node
				var source = nodes.byId[sourceId];
				if ((source.x || source.y) && !(node.x || node.y)) {
					node.x = source.x + Utilities.makeJitter(10);
					node.y = source.y + Utilities.makeJitter(10);
				}

				var link = null;
				if (links.byNodeIds[sourceId] &&
					links.byNodeIds[sourceId][targetId]) {
					// grab existing link
					link = links.byNodeIds[sourceId][targetId];
				} else if (links.byNodeIds[targetId] &&
					links.byNodeIds[targetId][sourceId]) {
					// add new link, but mark as duplicate
					link = links.addLink(sourceId, targetId);
					link.linkback = true;
				} else {
					// add new link
					link = links.addLink(sourceId, targetId);
				}

				callback(link);
			}


			/**
			 * Event subscribers
			 */

			var callbacks = {
				'update:nodes+links': [],
				'update:currentnode': []
			};

			function trigger(eventName) {

				var startTime = Date.now();

				callbacks[eventName].forEach(function (callback) {
					// they must determine
					// what has changed
					// for themselves
					callback(true);
				});

				var endTime = Date.now();
				console.log('trigger complete: ', eventName, endTime - startTime);
			}


			/**
			 *
			 * Public interface
			 *
			 */
			var CurrentSession = {

				/**
				 * Register for state changes
				 */

				addListener: function (eventName, callback) {
					callbacks[eventName].push(callback);
				},

				/**
				 * Read state
				 */

				getCurrentNode: function () {
					return nodes.byId[history.currentId];
				},

				getNodes: function () {
					return nodes.arr;
				},

				getLinks: function () {
					return links.arr;
				},

				hasForward: function () {
					return !!history.nextStack.length;
				},

				hasBackward: function () {
					return !!history.prevStack.length;
				},

				/**
				 * Change state
				 */

				goForward: function () {
					history.goForward();
					trigger('update:currentnode');
				},

				goBackward: function () {
					history.goBackward();
					trigger('update:currentnode');
				},

				setCurrentNode: function (nodeId) {
					history.setCurrentId(nodeId);
					trigger('update:currentnode');
				},

				removeNode: function (nodeId) {

					// validate existence
					var node = nodes.byId[nodeId];
					if (!node) return;

					// remove from collections
					nodes.removeNode(node.uuid);
					links.removeByNode(node.uuid);
					history.removeNode(node.uuid);

					// alert the media
					trigger('update:nodes+links');
					trigger('update:currentnode');

				},

				handleTitle: function (args) {

					var startTime = Date.now();

					var title = args.title.trim();
					var sourceNodeId = args.sourceNodeId; // add link from this node
					var noSetCurrent = args.noSetCurrent; // bool, don't update current node

					// must have title to handle title
					if (!(title && title.length)) return;

					// 1. find or add article
					// 2. find or add node
					// 3. find or add link (?)
					// 4. set current node (?)

					findOrAddArticle(title, function (article) {

						// TODO handle failure
						if (!article) return;

						findOrAddNode(article, function (node) {
							if (sourceNodeId) {
								findOrAddLink(node, sourceNodeId, function (link) {
									trigger('update:nodes+links');
									if (!noSetCurrent) {
										history.setCurrentId(node.uuid);
										trigger('update:currentnode');
									}

									var endTime = Date.now();
									console.log('handleTitle complete: ', endTime - startTime);

								});
							} else {
								trigger('update:nodes+links');
								if (!noSetCurrent) {
									history.setCurrentId(node.uuid);
									trigger('update:currentnode');
								}

								var endTime = Date.now();
								console.log('handleTitle complete: ', endTime - startTime);
							}
						});
					});
				},

				/**
				 * Manage state
				 */

				importState: function(session) {
					session = session.data;

					history.importState(session.history);
					nodes.importState(session.nodes);
					links.importState(session.links);

					trigger('update:nodes+links');
					trigger('update:currentnode');
				},

				exportState: function() {
					return {
						history: history.exportState(),
						nodes: nodes.exportState(),
						links: links.exportState()
					}
				},

				clearState: function() {
					history.clearState();
					nodes.clearState();
					links.clearState();

                    trigger('update:nodes+links');
				}
			};

			return CurrentSession;

		}]);

})();
