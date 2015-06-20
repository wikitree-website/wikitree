function ForceGraph(containerEl, scope) {
    var self = this;

    /**
     * Properties
     */

    // angular scope
    self.scope = scope;

    // html container
    self.containerEl = containerEl;

    // dimensions
    var rect = self.containerEl.getBoundingClientRect();
    self.width = rect.width;
    self.height = rect.height;

    // states
    self.mousePosition = {};
    self.keysPressed = {};
    self.justZoomed = false;
    self.isDragging = false;
    self.isLinking = false;

    // linking
    self.linkingCursor = null;
    self.linkingSource = null;

    // data
    self.nodes = [];
    self.links = [];

    // d3 selections
    self.svg;
    self.defs;
    self.rect;
    self.group;
    self.node;
    self.underlink;
    self.link;

    // d3 layouts & behaviors
    self.tick = self.makeTick();
    self.force = self.makeForce();
    self.zoom = self.makeZoom();
    self.drag = self.makeDrag();

    // event handlers
    self.nodeClick = self.makeNodeClick();
    self.nodeMouseover = self.makeNodeMouseover();
    self.nodeMouseout = self.makeNodeMouseout();
    self.linkMouseover = self.makeLinkMouseover();
    self.linkMouseout = self.makeLinkMouseout();

    // popovers
    self.nodePopoversById = {}; // nodePopover & noteNodePopover
    self.linkPopoversById = {}; // linkPopover
    self.editPopoversById = {}; // editPopover

    /**
     * Initialization
     */

    self.init();

    /**
     * Window events
     */

    d3.select(window)
        // resize on window resize
        .on('resize', function () {
            self.updateSize();
        })
        // keep track of key presses
        .on('keydown', function () {
            self.keysPressed[d3.event.keyCode] = true;
            // end linking state? (esc)
            if (self.keysPressed[27] && self.isLinking) {
                self.stopLinkingState();
            }
        })
        .on('keyup', function () {
            self.keysPressed[d3.event.keyCode] = false;
        })
        // track cursor
        .on('mousemove', function () {
            // update mouse position
            var scale = self.zoom.scale();
            var translate = self.zoom.translate();
            var x = (d3.event.x - translate[0]) / scale;
            var y = (d3.event.y - translate[1]) / scale;
            self.mousePosition.x = x;
            self.mousePosition.y = y;
            // update linking cursor position?
            if (!self.isLinking) return;
            self.linkingCursor.px = x;
            self.linkingCursor.py = y;
            self.linkingCursor.x = x;
            self.linkingCursor.y = y;
            self.tick();
            self.force.start();
        })
        // end linking state
        .on('click', function () {
            // let zoom soak a click
            if (self.justZoomed) {
                self.justZoomed = false;
                return;
            }
            // end link state?
            if (!self.isLinking) return;
            self.stopLinkingState();
        });

}

ForceGraph.prototype.init = function () {
    var self = this;

    self.svg = d3.select(self.containerEl)
        .append('svg')
        .attr('width', self.width)
        .attr('height', self.height);

    self.defs = self.svg
        .append('svg:defs');

    self.rect = self.svg
        .append('svg:rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .call(self.zoom)
        .on('dblclick.zoom', null);

    self.group = self.svg
        .append('svg:g');

    self.underlink = self.group
        .append('svg:g')
        .attr('class', 'underlinks')
        .selectAll('line.underlink');

    self.link = self.group
        .append('svg:g')
        .attr('class', 'links')
        .selectAll('line.link');

    self.node = self.group
        .append('svg:g')
        .attr('class', 'nodes')
        .selectAll('g.node');

    self.defs
        .selectAll('marker')
            .data([
                'link-arrow',
                'link-arrow-hover',
                'link-arrow-note',
                'link-arrow-note-hover'])
            .enter()
        .append('svg:marker')
            .attr('id', function(d) { return d; })
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 21)
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
        .append('path')
            .attr('d', 'M0,-5 L10,0 L0,5');

    self.defs
        .selectAll('marker')
        .append('svg:marker')
            .attr('id', 'link-arrow-note-linking')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 7)
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
        .append('path')
            .attr('d', 'M0,-5 L10,0 L0,5');
};

ForceGraph.prototype.getViewCenter = function () {
    var self = this;
    var scale = self.zoom.scale();
    var translate = self.zoom.translate();
    var translateX = translate[0] / scale;
    var translateY = translate[1] / scale;
    var width = self.width / scale;
    var height = self.height / scale;
    var x = width / 2 - translateX;
    var y = height / 2 - translateY;
    return [x, y];
};

ForceGraph.prototype.updateSize = function () {
    var self = this;

    // get container element size
    var rect = self.containerEl.getBoundingClientRect();
    self.width = rect.width;
    self.height = rect.height;

    // protect from bad timing
    if (!(self.width && self.height)) {
        console.error('graph size updating with no container size');
        return;
    }

    // update svg & force
    self.svg
        .attr('width', self.width)
        .attr('height', self.height);
    self.force
        .size([self.width, self.height])
        .start();
};

ForceGraph.prototype.updateCurrentNode = function (node) {
    var self = this;
    self.node.each(function (d) {
        if (node && node.uuid && d.uuid === node.uuid) {
            d3.select(this).classed('active', true);
        } else {
            d3.select(this).classed('active', false);
        }
    });
};

ForceGraph.prototype.updateNoteNodeContent = function (data) {
    var self = this;
    // find node group
    var g = self.node.filter(function (d) { return d.uuid === data.uuid });
    // scrape out children
    g.selectAll('*').remove();
    // rebuild
    self.addNoteNode(data, g);
};

ForceGraph.prototype.updateNodesAndLinks = function (nodes, links) {
    var self = this;

    // protect from bad timing
    if (!(self.width && self.height)) {
        console.error('graph size updating with no container size');
        return;
    }


    /**
     * Prep data
     */

    self.nodes = nodes.slice();
    self.links = links.slice();

    // add linking elements?
    if (self.isLinking) {
        var cursorNode = {
            uuid: 'linking-cursor-node',
            type: 'cursor',
            x: self.mousePosition.x || undefined,
            y: self.mousePosition.y || undefined,
            px: self.mousePosition.x || undefined,
            py: self.mousePosition.y || undefined,
            fixed: true
        }
        var cursorLink = {
            source: self.linkingSource,
            target: cursorNode,
            linking: true
        }
        nodes.push(cursorNode);
        links.push(cursorLink);
        self.linkingCursor = cursorNode;
    }

    // give nodes starting positions
    var viewCenter = self.getViewCenter();
    var centerX = viewCenter[0];
    var centerY = viewCenter[1];
    nodes.forEach(function (node) {
        if (!(node.x || node.y)) {
            node.x = centerX + (Math.random() * 5);
            node.y = centerY + (Math.random() * 5);
        }
    });

    // add graph properties
    self.force.nodes(nodes);
    self.force.links(links);


    /**
     * Update underlinks (needed for hearing mouse hovers)
     */

    // update underlink elements
    self.underlink = self.underlink.data(links, function (d) { return d.uuid; });
    // remove the old
    self.underlink.exit().remove();
    // add the new
    self.underlink
        .enter()
            .append('svg:line')
            .attr('class', 'underlink')
            .classed('linkback', function (d) { return d.linkbackId; })
            .classed('linking', function (d) { return d.linking; })
            .classed('note', function (d) { return d.source.type === 'note'; })
            .on('mouseover', self.linkMouseover)
            .on('mouseout', self.linkMouseout);


    /**
     * Update links
     */

    // update link elements
    self.link = self.link.data(links, function (d) { return d.uuid; });

    // remove the old
    var exitLink = self.link.exit();
    exitLink.each(function (d) {
        // clean out popovers
        if (self.linkPopoversById[d.uuid]) {
            self.linkPopoversById[d.uuid].$el.remove();
            delete self.linkPopoversById[d.uuid];
        }
    });
    exitLink.remove();

    // add the new
    var enterLink = self.link
        .enter()
            .append('svg:line')
            .attr('class', 'link')
            .classed('linkback', function (d) { return d.linkbackId; })
            .classed('linking', function (d) { return d.linking; })
            .classed('note', function (d) { return d.source.type === 'note'; });
    enterLink.each(function (d) {
        // add new popover
        if (d.linkbackId) {
            var popover = self.linkPopoversById[d.linkbackId];
            if (!popover) return;
            popover.addLinkback(d3.select(this));
        } else {
            self.linkPopoversById[d.uuid] = new LinkPopover(
                self.containerEl,
                self.scope,
                d,
                d3.select(this)
            );
        }
    });


    /**
     * Update nodes
     */

    self.node = self.node.data(nodes, function (d) { return d.uuid; });

    // remove the old
    var exitNode = self.node.exit();
    exitNode.each(function (d) {
        // clean out any node or note node popovers
        if (self.nodePopoversById[d.uuid]) {
            self.nodePopoversById[d.uuid].$el.remove();
            delete self.nodePopoversById[d.uuid];
        }
        // clean out any edit popovers
        if (self.editPopoversById[d.uuid]) {
            self.editPopoversById[d.uuid].$el.remove();
            delete self.editPopoversById[d.uuid];
        }
    });
    exitNode.remove();

    // add the new
    var enterNode = self.node.enter()
        .append('svg:g')
            .attr('class', 'node')
            .classed('fixed', function (d) { return d.fixed; })
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
    enterNode.each(function (d) {
        var g = d3.select(this);
        switch (d.type) {
            case 'article':
            case 'category':
            case 'search':
                self.addNode(d, g);
                break;
            case 'note':
                self.addNoteNode(d, g);
                break;
            case 'cursor':
                self.addCursorNode(d, g);
                break;
        }
    });


    /**
     * Nudge graph
     */

    // keep things moving
    self.force.start();

};

ForceGraph.prototype.addNode = function (d, g) {
    var self = this;

    // disc
    g.append('svg:circle')
        .attr('r', 16)
        .attr('class', 'disc')
        .on('mouseover', self.nodeMouseover)
        .on('mouseout', self.nodeMouseout)
        .on('click', self.nodeClick)
        .call(self.drag);

    // pin
    g.append('svg:circle')
        .attr('r', 3)
        .attr('class', 'pin');

    // name
    g.append('svg:text')
        .attr('class', 'name')
        .attr('dx', 6)
        .attr('dy', -6)
        .text(function (d) { return d.name })
        .on('click', self.nodeClick)
        .call(self.drag);

    // popover
    self.nodePopoversById[d.uuid] = new NodePopover(
        self.containerEl,
        self.scope,
        d,
        g
    );

};

ForceGraph.prototype.addNoteNode = function (d, g) {
    var self = this;

    // font awesome unicodes
    // http://fortawesome.github.io/Font-Awesome/cheatsheet/

    // note background
    g.append('svg:text')
        .attr('class', 'note-icon note-icon-back')
        .attr('dx', 0)
        .attr('dy', -1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-family', 'FontAwesome')
        .text('\uf15b') // fa-file

    // note foreground
    g.append('svg:text')
        .attr('class', 'note-icon note-icon-fore')
        .attr('dx', 0)
        .attr('dy', -1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-family', 'FontAwesome')
        .text('\uf016') // fa-file-o
        .on('mouseover', self.nodeMouseover)
        .on('mouseout', self.nodeMouseout)
        .on('click', self.nodeClick)
        .call(self.drag);

    // pin
    g.append('svg:circle')
        .attr('r', 3)
        .attr('class', 'pin');

    // name
    g.append('svg:text')
        .attr('class', 'note')
        .attr('dx', 18)
        .attr('dy', 4)
        .text(function (d) { return d.name })
        .on('click', self.nodeClick)
        .call(self.drag);

    // body
    g.append('foreignObject')
        .attr('width', 240)
        .attr('height', 120)
        .attr('x', 18)
        .attr('y', function (d) {
            if (d.name && d.name.length) {
                return 8;
            } else {
                return -8;
            }
        })
        .style('overflow', 'visible')
        .on('click', self.nodeClick)
        .call(self.drag)
        .append('xhtml:body')
            .html(function (d) {
                return d.body ? d.body.replace(/\n/g, '<br>') : '';
            })
            .each(function (d) {
                var foreignObject = this.parentNode;
                foreignObject.setAttribute('width', this.clientWidth);
                foreignObject.setAttribute('height', this.clientHeight);
            });

    // note node popover
    self.nodePopoversById[d.uuid] = new NoteNodePopover(
        self.containerEl,
        self.scope,
        d,
        g
    );

    // edit popover
    self.editPopoversById[d.uuid] = new EditPopover(
        self.containerEl,
        self.scope,
        d
    );

};

ForceGraph.prototype.addCursorNode = function (d, g) {
    var self = this;

    // disc
    g.append('svg:circle')
        .attr('r', 1)
        .attr('class', 'cursor');

};

ForceGraph.prototype.updatePopovers = function () {
    var self = this;
    var scale = self.zoom.scale();
    var translate = self.zoom.translate();
    var translateX = translate[0];
    var translateY = translate[1];
    // node popovers
    Object.keys(self.nodePopoversById).forEach(function (id) {
        var popover = self.nodePopoversById[id];
        if (popover.hidden) return;
        var x = popover.node.x * scale + translateX;
        var y = popover.node.y * scale + translateY;
        y += 14 * scale; // shift below center
        popover.position(x, y);
    });
    // edit popovers
    Object.keys(self.editPopoversById).forEach(function (id) {
        var popover = self.editPopoversById[id];
        if (popover.hidden) return;
        var x = popover.node.x * scale + translateX;
        var y = popover.node.y * scale + translateY;
        x += 10 * scale; // shift to the right
        popover.position(x, y);
    });
    // link popovers
    Object.keys(self.linkPopoversById).forEach(function (id) {
        var popover = self.linkPopoversById[id];
        if (popover.hidden) return;
        var node1 = popover.link.source;
        var node2 = popover.link.target;
        var x1 = node1.x * scale + translateX;
        var y1 = node1.y * scale + translateY;
        var x2 = node2.x * scale + translateX;
        var y2 = node2.y * scale + translateY;
        var centerX = (x1 + x2) / 2;
        var centerY = (y1 + y2) / 2;
        popover.position(centerX, centerY);
    });
};

ForceGraph.prototype.updateNodePopover = function (popover) {
    var self = this;
    var scale = self.zoom.scale();
    var translate = self.zoom.translate();
    var translateX = translate[0];
    var translateY = translate[1];
    var x = popover.node.x * scale + translateX;
    var y = popover.node.y * scale + translateY;
    y += 14 * scale; // shift below center
    popover.position(x, y);
};

ForceGraph.prototype.updateEditPopover = function (popover) {
    var self = this;
    var scale = self.zoom.scale();
    var translate = self.zoom.translate();
    var translateX = translate[0];
    var translateY = translate[1];
    var x = popover.node.x * scale + translateX;
    var y = popover.node.y * scale + translateY;
    x += 10 * scale; // shift to the right
    popover.position(x, y);
};

ForceGraph.prototype.updateLinkPopover = function (popover) {
    var self = this;
    var scale = self.zoom.scale();
    var translate = self.zoom.translate();
    var translateX = translate[0];
    var translateY = translate[1];
    var node1 = popover.link.source;
    var node2 = popover.link.target;
    var x1 = node1.x * scale + translateX;
    var y1 = node1.y * scale + translateY;
    var x2 = node2.x * scale + translateX;
    var y2 = node2.y * scale + translateY;
    var centerX = (x1 + x2) / 2;
    var centerY = (y1 + y2) / 2;
    popover.position(centerX, centerY);
};

ForceGraph.prototype.hideAllPopovers = function (exceptId) {
    var self = this;
    Object.keys(self.nodePopoversById).forEach(function (id) {
        if (id == exceptId) return;
        var popover = self.nodePopoversById[id];
        if (popover.hidden) return;
        popover.hide(true);
    });
    Object.keys(self.linkPopoversById).forEach(function (id) {
        if (id == exceptId) return;
        var popover = self.linkPopoversById[id];
        if (popover.hidden) return;
        popover.hide(true);
    });
};

ForceGraph.prototype.makeTick = function () {
    var self = this;
    function x1(d) { return d.source.x; }
    function y1(d) { return d.source.y; }
    function x2(d) { return d.target.x; }
    function y2(d) { return d.target.y; }
    function transform(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    }
    return function () {
        self.underlink
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2);
        self.link
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2);
        self.node
            .attr('transform', transform);
        self.updatePopovers();
    };
};

ForceGraph.prototype.makeForce = function () {
    var self = this;
    return d3.layout.force()
        .size([this.width, this.height])
        .linkDistance(100)
        .linkDistance(function (d) {
            switch (d.source.type) {
                case 'article':
                case 'category':
                case 'search':
                    return 100;
                case 'note':
                case 'cursor':
                    return 1;
            }
        })
        .linkStrength(function (d) {
            switch (d.source.type) {
                case 'article':
                case 'category':
                case 'search':
                    return 0.2;
                case 'note':
                case 'cursor':
                    return 0.07;
            }
        })
        .charge(function (d) {
            switch (d.type) {
                case 'article':
                case 'category':
                case 'search':
                    return -400;
                case 'note':
                    return -800;
                case 'cursor':
                    return 0;
            }
        })
        .gravity(0.03)
        .friction(0.8)
        .theta(0.9)
        .alpha(0.1)
        .on('tick', this.tick);

};

ForceGraph.prototype.makeZoom = function () {
    var self = this;
    return d3.behavior.zoom()
        .scaleExtent([0.2, 10])
        .on('zoom', function () {
            self.group.attr(
                'transform',
                'translate(' + d3.event.translate + ')' +
                'scale(' + d3.event.scale + ')'
            );

            self.updatePopovers();

            // prevent greedy click event
            self.justZoomed = true;

        });
};

ForceGraph.prototype.makeDrag = function () {
    var self = this;
    return d3.behavior.drag()
        .on('dragstart', function (d, i) {
            if (self.isLinking) return;
            d3.event.sourceEvent.stopPropagation();
        })
        .on('drag', function (d, i) {
            if (self.isLinking) return;
            if (!self.isDragging) {
                self.isDragging = true;

                // hide popover on drag
                self.nodePopoversById[d.uuid].$el.hide();

                if (!self.keysPressed[16]) {
                    // only fix if user not holding shift
                    d3.select(this.parentNode).classed('fixed', true);
                    d.fixed = true;
                }
            }
            self.force.start();
            d3.event.sourceEvent.stopPropagation();
            d.px += d3.event.x;
            d.py += d3.event.y;
            d.x += d3.event.x;
            d.y += d3.event.y;
            self.tick();
        })
        .on('dragend', function (d, i) {
            if (self.isLinking) return;
            d3.event.sourceEvent.stopPropagation();
            if (self.isDragging) {
                self.tick();

                // show popover when done drag
                var popover = self.nodePopoversById[d.uuid];
                self.updateNodePopover(popover);
                popover.$el.show();

                // also prevents selecting on drag
                setTimeout(function () {
                    self.isDragging = false;
                    popover.show();
                }, 50);

            }
        });
};

ForceGraph.prototype.makeNodeClick = function () {
    var self = this;
    return function (d) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        if (self.isDragging) return;
        if (self.isLinking) {
            // clicked link source?
            if (d.uuid === self.linkingSource.uuid) {
                // end linking state
                self.stopLinkingState();
            } else {
                // add link to this node
                self.scope.$apply(function () {
                    self.scope.addLink(
                        self.linkingSource.uuid,
                        d.uuid
                    );
                });
            }
        } else if (d3.event.shiftKey) {
            // toggle this node's pin state
            self.toggleNodePin(d, d3.select(this.parentNode));
        } else {
            if (d.type === 'note') {
                // toggle note edit popover
                var editPopover = self.editPopoversById[d.uuid];
                var nodePopover = self.nodePopoversById[d.uuid];
                if (editPopover.hidden) {
                    // update & show edit popover
                    self.updateEditPopover(editPopover);
                    editPopover.show();
                    // hide node popover
                    nodePopover.hide(true);
                } else {
                    // hide edit popover
                    editPopover.hide();
                    // show node popover
                    nodePopover.show();
                }
            } else {
                // set this node as current
                self.scope.$apply(function () {
                    self.scope.setCurrentNode(d.uuid);
                });
            }
        }
    };
};

ForceGraph.prototype.makeNodeMouseover = function () {
    var self = this;
    return function (d) {
        if (self.isDragging) return;
        if (self.isLinking) return;
        d.hovered = true;
        var popover = self.nodePopoversById[d.uuid];
        self.updateNodePopover(popover);
        self.hideAllPopovers(d.uuid);
        popover.show();
    };
};

ForceGraph.prototype.makeNodeMouseout = function () {
    var self = this;
    return function (d) {
        if (self.isDragging) return;
        if (self.isLinking) return;
        d.hovered = false;
        var popover = self.nodePopoversById[d.uuid];
        popover.hide();
    };
};

ForceGraph.prototype.makeLinkMouseover = function () {
    var self = this;
    return function (d) {
        if (self.isDragging) return;
        if (self.isLinking) return;
        d.hovered = true;
        d3.select(this).classed('hovered', true);
        var popover = self.linkPopoversById[d.uuid];
        self.updateLinkPopover(popover);
        self.hideAllPopovers(d.uuid);
        popover.show();
    };
};

ForceGraph.prototype.makeLinkMouseout = function () {
    var self = this;
    return function (d) {
        if (self.isDragging) return;
        if (self.isLinking) return;
        d.hovered = false;
        d3.select(this).classed('hovered', false);
        var popover = self.linkPopoversById[d.uuid];
        popover.hide();
    };
};

ForceGraph.prototype.toggleNodePin = function (nodeData, nodeSelection) {
    var self = this;
    if (!nodeSelection) {
        nodeSelection = self.node
            .filter(function (d) {
                return d.uuid === nodeData.uuid
            });
    }
    nodeData.fixed = !nodeData.fixed;
    nodeSelection.classed('fixed', nodeData.fixed);
    self.force.start();
};

ForceGraph.prototype.centerOnNode = function (node) {
    var self = this;
    if (!node) return;
    var scale = self.zoom.scale();
    var w = self.width;
    var h = self.height;
    var x = node.x * scale;
    var y = node.y * scale;
    var translateX = (w / 2) - x;
    var translateY = (h / 2) - y;
    self.zoom.translate([translateX, translateY]);
    self.zoom.event(self.rect.transition().duration(600));
};

ForceGraph.prototype.startLinkingState = function (node) {
    var self = this;
    self.isLinking = true;
    self.linkingSource = node;
    self.updateNodesAndLinks(
        self.nodes,
        self.links
    );
};

ForceGraph.prototype.stopLinkingState = function () {
    var self = this;
    self.isLinking = false;
    self.linkingSource = null;
    self.linkingCursor = null;
    self.updateNodesAndLinks(
        self.nodes,
        self.links
    );
};
