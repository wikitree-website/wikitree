/**
 * Models current Wikipedia map
 *     - nodeHistory:   prev/next stacks of visited nodes
 *     - nodes:         nodes (with article and graph data)
 *     - links:         links (with source and target nodes)
 *     - articles:      cache of wikipedia articles
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
var mapModel = (function () {


    function makeUUID() {
        // http://stackoverflow.com/a/2117523
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }


    /**
     * Node history
     */

    var nodeHistory = (function () {
        var currentId = undefined;
        var prevStack = [];
        var nextStack = [];
        return {
            setCurrentId: function (nodeId) {
                // as with browser history,
                // when jumping to new page
                // add current to prev stack
                // and flush out next stack
                prevStack.push(currentId);
                nextStack = [];
                currentId = nodeId;
                return currentId;
            },
            getCurrentId: function () {
                return currentId;
            },
            goBackward: function () {
                if (!prevStack.length) return null;
                nextStack.push(currentId);
                currentId = prevStack.pop();
                return currentId;
            },
            goForward: function () {
                if (!nextStack.length) return null;
                prevStack.push(currentId);
                currentId = nextStack.pop();
                return currentId;
            }
        };
    })();


    /**
     * Node collection
     */

    var nodes = (function () {
        function Node(article) {
            this.uuid = makeUUID();
            this.article = article; // actually article.parse

            // d3 force graph attributes
            // https://github.com/mbostock/d3/wiki/Force-Layout#nodes
            // NOTE okay to leave here? or better d3 creates its own copies?
            this.index; // the zero-based index of the node within the nodes array.
            this.x; // the x-coordinate of the current node position.
            this.y; // the y-coordinate of the current node position.
            this.px; // the x-coordinate of the previous node position.
            this.py; // the y-coordinate of the previous node position.
            this.fixed; // a boolean indicating whether node position is locked.
            this.weight; // the node weight; the number of associated links.

        }
        var nodes = [];
        var byId = {};
        var byTitle = {};
        return {
            nodes: nodes,
            byId: byId,
            byTitle: byTitle,
            addNode: function (title) {
                var node = new Node(title);
                nodes.push(node);
                byId[node.uuid] = node;
                byTitle[node.article.title] = node;
                return node;
            },
            removeNode: function (nodeId) {
                var node = byId[nodeId];
                if (!node) return null;
                nodes = nodes.filter(function (n) { return n.uuid !== node.uuid });
                delete byId[node.uuid];
                delete byTitle[node.article.title];
                return node;
            }
        };
    })();


    /**
     * Link collection
     */

    var links = (function () {
        function Link(source, target) {
            this.uuid = makeUUID();
            // d3 force graph attributes
            // https://github.com/mbostock/d3/wiki/Force-Layout#links
            this.source = source;
            this.target = target;
        }
        var links = [];
        var byId = {};
        var byNodeIds = {};
        return {
            links: links,
            byId: byId,
            byNodeIds: byNodeIds,
            addLink: function (sourceId, targetId) {
                var source = nodes.byId[sourceId];
                var target = nodes.byId[targetId];
                var link = new Link(source, target);
                links.push(link);
                if (!byNodeIds[sourceId]) byNodeIds[sourceId] = {};
                byNodeIds[sourceId][targetId] = link;
                byId[link.uuid] = link;
                return link;
            },
            removeLink: function (sourceId, targetId) {
                var link = byNodeIds[sourceId][targetId];
                if (!link) return null;
                links = links.filter(function (l) { return l.uuid !== link.uuid });
                delete byNodeIds[sourceId][targetId];
                delete byId[link.uuid];
                return link;
            }
        };
    })();


    /**
     * Article collection
     */

    var articles = (function () {
        function Article(unsafeTitle, callback) {
            this.uuid = makeUUID();
            this.unsafeTitle = unsafeTitle;
            this.parse = {
                title: undefined,
                text: undefined,
                contenthtml: undefined
            };
            this.getFromAPI(callback);
        }
        Article.prototype.getFromAPI = function (callback) {
            // http://www.mediawiki.org/wiki/API:Parsing_wikitext
            var self = this;
            $.ajax({
                url: 'https://en.wikipedia.org/w/api.php',
                type: 'GET',
                dataType: 'jsonp',
                data: {
                    action: 'parse',
                    format: 'json',
                    prop: 'text|categorieshtml|displaytitle',
                    redirects: 'true',
                    page: self.unsafeTitle
                },
                success: function (res) {
                    if (res && res.parse && res.parse.title && res.parse.text['*']) {
                        // hooray!
                        // populate self
                        self.parse.title = res.parse.title;
                        self.parse.text = res.parse.text['*'];
                        self.parse.categories = res.parse.categorieshtml['*'];
                        // call callback
                        if (callback) callback(self);
                    } else {
                        // something failed
                        // remove self from reference
                        delete byUnsafeTitle[self.unsafeTitle];
                        // callback with null
                        if (callback) callback(null);
                    }
                },
                error: function () {
                    // something failed
                    // remove self from reference
                    delete byUnsafeTitle[self.unsafeTitle];
                    // callback with null
                    if (callback) callback(null);
                }
            });
        }
        var byUnsafeTitle = {};
        return {
            byUnsafeTitle: byUnsafeTitle,
            addArticle: function (unsafeTitle, callback) {
                var article = new Article(unsafeTitle, callback);
                byUnsafeTitle[article.unsafeTitle] = article;
                return article;
            }
        };
    })();


    /**
     * Find or Add nest/chain
     */

    function findOrAddArticle(title, callback) {
        var article = articles.byUnsafeTitle[title];
        if (article && article.parse && article.parse.title) {
            // already got article
            callback(article.parse);
        } else {
            // add new article
            articles.addArticle(title, function (article) {
                if (article && article.parse && article.parse.title) {
                    // load success!
                    callback(article.parse);
                } else {
                    // load failed!
                    callback(null);
                }
            });
        }
    }

    function findOrAddNode(article, callback) {
        var node = nodes.byTitle[article.title];
        if (!node) node = nodes.addNode(article);
        callback(node);
    }

    function findOrAddLink(node, callback) {
        var sourceId = nodeHistory.getCurrentId();
        var targetId = node.uuid;
        var link;
        if (links.byNodeIds[sourceId] && links.byNodeIds[sourceId][targetId]) {
            link = links.byNodeIds[sourceId][targetId];
        } else if (links.byNodeIds[targetId] && links.byNodeIds[targetId][sourceId]) {
            // NOTE prevents duplicate links... do we want?
            link = links.byNodeIds[targetId][sourceId];
        } else {
            link = links.addLink(sourceId, targetId);
        }
        callback(link);
    }


    /**
     * Event subscribers
     */

    var callbacks = { update: [] };
    function trigger(event) {
        callbacks[event].forEach(function (callback) {
            // they must determine
            // what has changed
            // for themselves
            callback(true);
        });
    }


    /**
     *
     * Public interface
     *
     */
    return {

        /**
         * Register for state changes
         */

        addListener: function (event, callback) {
            callbacks[event].push(callback);
        },

        /**
         * Read state
         */

        getCurrentNode: function () {
            return nodes.byId[nodeHistory.getCurrentId()];
        },

        getNodes: function () {
            return nodes.nodes;
        },

        getLinks: function () {
            return links.links;
        },

        /**
         * Change state
         */

        setCurrentNode: function (nodeId) {
            nodeHistory.setCurrentId(nodeId);
            trigger('update');
        },

        goForward: function () {
            nodeHistory.goForward();
            trigger('update');
        },

        goBackward: function () {
            nodeHistory.goBackward();
            trigger('update');
        },

        handleTitle: function (args) {

            var title = args.title.toLowerCase();
            var fromCurrent = args.fromCurrent; // bool, do link from current node
            var noSetCurrent = args.noSetCurrent; // bool, don't update current node

            // 1. find or add article
            // 2. find or add node
            // 3. find or add link (?)
            // 4. set current node (?)

            findOrAddArticle(title, function (article) {

                // TODO handle failure
                if (!article) return;

                findOrAddNode(article, function (node) {
                    if (fromCurrent) {
                        findOrAddLink(node, function (link) {
                            if (!noSetCurrent) {
                                nodeHistory.setCurrentId(node.uuid);
                            }
                            trigger('update');
                        });
                    } else {
                        if (!noSetCurrent) {
                            nodeHistory.setCurrentId(node.uuid);
                        }
                        trigger('update');
                    }
                });
            });
        }
    };

})();
