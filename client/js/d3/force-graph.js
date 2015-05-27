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
    self.link;

    // d3 layouts & behaviors
    self.tick = self.makeTick();
    self.force = self.makeForce();
    self.zoom = self.makeZoom();
    self.drag = self.makeDrag();

    // event handlers
    self.nodeClick = self.makeNodeClick();

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
        .append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .call(self.zoom)
        .on('dblclick.zoom', null);
    self.group = self.svg
        .append('g');
    self.link = self.group
        .append('svg:g')
        .attr('class', 'links')
        .selectAll('line.link');
    self.node = self.group
        .append('svg:g')
        .attr('class', 'nodes')
        .selectAll('g.node');

    // link arrow markers
    self.svg.append('defs')
        .selectAll('marker')
            .data(['arrow'])
            .enter()
        .append('marker')
            .attr('id', function(d) { return d; })
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 21)
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
        .append('path')
            .attr('d', 'M0,-5 L10,0 L0,5')
            .style('fill', '#A0A0A0');
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

    // update link elements
    self.link = self.link.data(links, function (d) { return d.uuid; });
    self.link.exit().remove();
    var newLink = self.link
        .enter()
            .append('svg:line')
            .attr('class', 'link')
            .style('marker-end', 'url(#arrow)')
            .classed('linkback', function (d) { return d.linkback; });

    // update node elements
    self.node = self.node.data(nodes, function (d) { return d.uuid; });
    self.node.exit().remove();
    var newNode = self.node.enter()
        .append('svg:g')
            .attr('class', 'node')
            .classed('fixed', function (d) { return d.fixed; })
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
    newNode
        .append('svg:circle')
            .attr('r', 9)
            .on('click', self.nodeClick)
            .call(self.drag);
    newNode
        .append('svg:text')
            .attr('class', 'name')
            .attr('dx', 6)
            .attr('dy', -6)
            .text(function (d) { return d.name })
            .on('click', self.nodeClick)
            .call(self.drag);

    // keep things moving
    self.force.start();

};

ForceGraph.prototype.makeTick = function () {
    var self = this;
    // cache function creation for tiny optimization
    function x1(d) { return d.source.x; }
    function y1(d) { return d.source.y; }
    function x2(d) { return d.target.x; }
    function y2(d) { return d.target.y; }
    function transform(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    }
    return function () {
        self.link
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2);
        self.node
            .attr('transform', transform);
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
        });
};

ForceGraph.prototype.makeDrag = function () {
    var self = this;
    var isDragging = false;
    return d3.behavior.drag()
        .on('dragstart', function (d, i) {
            d3.event.sourceEvent.stopPropagation();
        })
        .on('drag', function (d, i) {
            if (!isDragging) {
                isDragging = true;
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
            if (isDragging) {
                self.tick();
                isDragging = false;
                self.scope.saveSession();
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
            self.scope.setCurrentNode(d.uuid);
        }
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
