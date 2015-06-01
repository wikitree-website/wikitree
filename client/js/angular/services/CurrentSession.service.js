(function() {
    angular.module('wikitree').
        factory('CurrentSession', [
        	'$rootScope',
            'Utilities',
            'Articles',
            'Searches',
            'Categories',
            function ($rootScope, Utilities, Articles, Searches, Categories) {

                /**
                 * Models current Wikipedia map
                 *     - history:   prev/next stacks of visited nodes
                 *     - nodes:         nodes (with article and graph data)
                 *     - links:         links (with source and target nodes)
                 *     - callbacks:     lists of update:<detail> callbacks
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

                        // find a new current node?
                        if (history.currentId === nodeId) {
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
                    this.type = args.type;
                    this.name = args.name;
                    this.title = args.title; // if type = article | category
                    this.query = args.query; // if type = search
                    // d3 force graph attributes
                    // https://github.com/mbostock/d3/wiki/Force-Layout#nodes
                    this.index = undefined; // the zero-based index of the node within the nodes array.
                    this.x = undefined; // the x-coordinate of the current node position.
                    this.y = undefined; // the y-coordinate of the current node position.
                    this.px = undefined; // the x-coordinate of the previous node position.
                    this.py = undefined; // the y-coordinate of the previous node position.
                    this.fixed = undefined; // a boolean indicating whether node position is locked.
                    this.weight = undefined; // the node weight; the number of associated links.
                    // custom d3 force graph attributes
                    this.justDragged = undefined;
                    this.isDragging = undefined;
                    this.hovered = undefined;
                }

                nodes = {
                    arr: [],
                    byId: {},
                    byName: {},
                    addNode: function (args) {
                        var node = new Node({
                            type: args.type,
                            name: args.name,
                            title: args.title,
                            query: args.query
                        });
                        nodes.arr.push(node);
                        nodes.byId[node.uuid] = node;
                        nodes.byName[node.name] = node;
                        return node;
                    },
                    removeNode: function (nodeId) {
                        var node = nodes.byId[nodeId];
                        if (!node) return null;
                        nodes.arr = nodes.arr.filter(function (n) { return n.uuid !== node.uuid });
                        delete nodes.byId[node.uuid];
                        delete nodes.byName[node.name];
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
                        nodes.byName = {};
                        nodes.arr.forEach(function (node) {
                            nodes.byId[node.uuid] = node;
                            nodes.byName[node.name] = node;
                        });
                    },
                    clearState: function () {
                        nodes.arr = [];
                        nodes.byId = {};
                        nodes.byName = {};
                    }
                };


                /**
                 * Link collection
                 */

                function Link(args) {
                    this.uuid = args.uuid || Utilities.makeUUID();
                    this.sourceId = args.sourceId;
                    this.targetId = args.targetId;
                    this.linkbackId = undefined;
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
                        if (!links.byNodeIds[sourceId]) return null;
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
                    removeDeepById: function (linkId) {
                        var link = links.byId[linkId];
                        if (!link) return;
                        var nodeA = link.source;
                        var nodeB = link.target;
                        // remove both directions
                        links.removeLink(nodeA.uuid, nodeB.uuid);
                        links.removeLink(nodeB.uuid, nodeA.uuid);
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

                function findOrAddArticle(title) {

                    // is this a category?
                    if (title.match(/^Category:/)) {
                        // skip to special handler
                        return findOrAddCategory(title);
                    }

                    return Articles.getByUnsafeTitle(title).
                        then(function (article) {
                            return{
                                type: 'article',
                                name: article.title,
                                title: article.title
                            };
                        }).
                        catch(function (err) {
                            console.log('In findOrAddArticle', err);
                            // no result? try searching
                            return findOrAddSearch(title);
                        });
                }

                function findOrAddCategory(title) {
                    return Categories.getByUnsafeTitle(title).
                        then(function (category) {
                            return {
                                type: 'category',
                                name: category.title,
                                title: category.title
                            };
                        }).
                        catch(function (err) {
                            console.log('In findOrAddCategory', err);
                            // no result? try searching
                            return findOrAddSearch(title);
                        });
                }

                function findOrAddSearch(query) {
                    return Searches.getByQuery(query).
                        then(function (search) {
                            return {
                                type: 'search',
                                name: 'Search "' + query + '"',
                                query: query
                            };
                        }).
                        catch(function (err) {
                            console.log('In findOrAddSearch', err);
                            // no dice
                            return null;
                        });
                }

                function findOrAddNode(args, callback) {
                    var node = nodes.byName[args.name];
                    if (!node) node = nodes.addNode(args);
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
                        link.linkbackId = links.byNodeIds[targetId][sourceId].uuid;
                    } else {
                        // add new link
                        link = links.addLink(sourceId, targetId);
                    }

                    callback(link);
                }


                /**
                 *
                 * Public interface
                 *
                 */
                var CurrentSession = {

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

                    getNode: function (nodeId) {
                        return nodes.byId[nodeId];
                    },

                    getLink: function (linkId) {
                        return links.byId[linkId];
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
                        $rootScope.$broadcast('update:currentnode');
                    },

                    goBackward: function () {
                        history.goBackward();
                        $rootScope.$broadcast('update:currentnode');
                    },

                    setCurrentNode: function (nodeId) {
                        history.setCurrentId(nodeId);
                        $rootScope.$broadcast('update:currentnode');
                    },

                    removeNode: function (nodeId) {

                        // validate existence
                        var node = nodes.byId[nodeId];
                        if (!node) return;

                        console.log('removeNode', node.name);

                        // remove from collections
                        nodes.removeNode(node.uuid);
                        links.removeByNode(node.uuid);
                        history.removeNode(node.uuid);

                        // alert the media
                        $rootScope.$broadcast('update:nodes+links');
                        $rootScope.$broadcast('update:currentnode');

                    },

                    removeLink: function (linkId) {

                        // validate existence
                        var link = links.byId[linkId];
                        if (!link) return;

                        // remove from collections
                        links.removeDeepById(link.uuid);

                        // alert the media
                        $rootScope.$broadcast('update:nodes+links');

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

                        findOrAddArticle(title).
                            then(function (result) {

                                // TODO handle failure
                                if (!result) {
                                    alert('Sorry, something went wrong for "' + title + '"');
                                    return;
                                };

                                return findOrAddNode(result, function (node) {
                                    if (sourceNodeId) {
                                        findOrAddLink(node, sourceNodeId, function (link) {

                                            $rootScope.$broadcast('update:nodes+links');

                                            if (!noSetCurrent) {
                                                history.setCurrentId(node.uuid);
                                                $rootScope.$broadcast('update:currentnode');
                                            }

                                            var endTime = Date.now();
                                            console.log('handleTitle complete: ', endTime - startTime);

                                        });
                                    } else {

                                        $rootScope.$broadcast('update:nodes+links');

                                        if (!noSetCurrent) {
                                            history.setCurrentId(node.uuid);
                                            $rootScope.$broadcast('update:currentnode');
                                        }

                                        var endTime = Date.now();
                                        console.log('handleTitle complete: ', endTime - startTime);

                                    }
                                });
                            });
                    },

                    handleTitleSearch: function (args) {

                        // identical to handleTitle
                        // EXCEPT skips straight to search results

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

                        findOrAddSearch(title).
                            then(function (result) {

                                // TODO handle failure
                                if (!result) {
                                    alert('Sorry, something went wrong for "' + title + '"');
                                    return;
                                };

                                return findOrAddNode(result, function (node) {
                                    if (sourceNodeId) {
                                        findOrAddLink(node, sourceNodeId, function (link) {

                                            $rootScope.$broadcast('update:nodes+links');

                                            if (!noSetCurrent) {
                                                history.setCurrentId(node.uuid);
                                                $rootScope.$broadcast('update:currentnode');
                                            }

                                            var endTime = Date.now();
                                            console.log('handleTitleSearch complete: ', endTime - startTime);

                                        });
                                    } else {

                                        $rootScope.$broadcast('update:nodes+links');

                                        if (!noSetCurrent) {
                                            history.setCurrentId(node.uuid);
                                            $rootScope.$broadcast('update:currentnode');
                                        }

                                        var endTime = Date.now();
                                        console.log('handleTitleSearch complete: ', endTime - startTime);

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

                        $rootScope.$broadcast('update:nodes+links');
                        $rootScope.$broadcast('update:currentnode');
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

                        $rootScope.$broadcast('update:nodes+links');
                    }
                };

                return CurrentSession;

            }
        ]);

})();
