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
    self.width = containerEl.clientWidth;
    self.height = containerEl.clientHeight;

    // user pressed keycode reference
    self.keysPressed = {};

    // d3 selections
    self.svg;
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
    self.nodePopoversById = {};
    self.linkPopoversById = {};

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
        })
        .on('keyup', function () {
            self.keysPressed[d3.event.keyCode] = false;
        });

}

ForceGraph.prototype.init = function () {
    var self = this;

    self.svg = d3.select(self.containerEl)
        .append('svg')
        .attr('width', self.width)
        .attr('height', self.height);

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

    self.svg.append('defs')
        .selectAll('marker')
            .data(['link-arrow', 'link-arrow-hover'])
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
};

ForceGraph.prototype.updateSize = function () {
    var self = this;
    self.width = self.containerEl.clientWidth;
    self.height = self.containerEl.clientHeight;

    // protect from bad timing
    if (!(self.width && self.height)) {
        console.error('graph size updating with no container size');
        return;
    }

    self.svg
        .attr('width', self.width)
        .attr('height', self.height);
    self.force
        .size([self.width, self.height])
        .start();
};

ForceGraph.prototype.updateCurrentNode = function (node) {
    var self = this;
    self.node.classed('active', function (d) {
        return d.uuid === node.uuid;
    });
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

    // give nodes starting positions
    var centerX = self.width / 2;
    var centerY = self.height / 2;
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
            .classed('linkback', function (d) { return d.linkbackId; });
    // popover
    enterLink.each(function (d) {
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
        // clean out popovers
        if (self.nodePopoversById[d.uuid]) {
            self.nodePopoversById[d.uuid].$el.remove();
            delete self.nodePopoversById[d.uuid];
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
    // circle
    enterNode
        .append('svg:circle')
            .attr('r', 9)
            .on('mouseover', self.nodeMouseover)
            .on('mouseout', self.nodeMouseout)
            .on('click', self.nodeClick)
            .call(self.drag);
    // label
    enterNode
        .append('svg:text')
            .attr('class', 'name')
            .attr('dx', 6)
            .attr('dy', -6)
            .text(function (d) { return d.name })
            .on('click', self.nodeClick)
            .call(self.drag);
    // popover
    enterNode.each(function (d) {
        self.nodePopoversById[d.uuid] = new NodePopover(
            self.containerEl,
            self.scope,
            d,
            d3.select(this)
        );
    });

    /**
     * Nudge graph
     */

    // keep things moving
    self.force.start();

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
        y += 10 * scale; // shift below center
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
    y += 10 * scale; // shift below center
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
        .linkStrength(0.2)
        .charge(-400)
        .gravity(0.03)
        .friction(0.8)
        .theta(0.9)
        .alpha(0.1)
        .on('tick', this.tick)
        .on('end', function () {
            self.scope.saveSession();
        });
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
        });
};

ForceGraph.prototype.makeDrag = function () {
    var self = this;
    return d3.behavior.drag()
        .on('dragstart', function (d, i) {
            d3.event.sourceEvent.stopPropagation();
        })
        .on('drag', function (d, i) {
            if (!d.isDragging) {
                d.isDragging = true;

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
            d3.event.sourceEvent.stopPropagation();
            if (d.isDragging) {
                self.tick();
                self.scope.saveSession();
                d.isDragging = false;

                // show popover when done drag
                self.nodePopoversById[d.uuid].$el.show();

                // prevent selecting on drag
                d.justDragged = true;
                setTimeout(function () {
                    delete d.justDragged;
                }, 50);
            }
        });
};

ForceGraph.prototype.makeNodeClick = function () {
    var self = this;
    return function (d) {
        d3.event.preventDefault();
        if (d.justDragged) return;
        if (d3.event.shiftKey) {
            // toggle this node's pin state
            self.toggleNodePin(d, d3.select(this.parentNode));
        } else {
            // set this node as current
            self.scope.$apply(function () {
                self.scope.setCurrentNode(d.uuid);
            });
        }
    };
};

ForceGraph.prototype.makeNodeMouseover = function () {
    var self = this;
    return function (d) {
        d.hovered = true;
        var popover = self.nodePopoversById[d.uuid];
        self.updateNodePopover(popover);
        popover.show();
    };
};

ForceGraph.prototype.makeNodeMouseout = function () {
    var self = this;
    return function (d) {
        if (d.isDragging) return;
        d.hovered = false;
        var popover = self.nodePopoversById[d.uuid];
        popover.hide();
    };
};

ForceGraph.prototype.makeLinkMouseover = function () {
    var self = this;
    return function (d) {
        d.hovered = true;
        d3.select(this).classed('hovered', true);
        var popover = self.linkPopoversById[d.uuid];
        self.updateLinkPopover(popover);
        popover.show();
    };
};

ForceGraph.prototype.makeLinkMouseout = function () {
    var self = this;
    return function (d) {
        if (d.isDragging) return;
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
    self.scope.saveSession();
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
