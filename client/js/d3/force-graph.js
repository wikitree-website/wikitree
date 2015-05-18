function ForceGraph(containerEl, session, sessions, articles) {

    /**
     * Properties
     */

    // angular things
    this.ng = {};
    this.ng.session = session;
    this.ng.sessions = sessions;
    this.ng.articles = articles;

    // user pressed keycode reference
    this.keysPressed = {};

    // html container
    this.containerEl = containerEl;

    // dimensions
    this.width = containerEl.clientWidth;
    this.height = containerEl.clientHeight;

    // d3 selections
    this.svg;
    this.rect;
    this.group;
    this.node;
    this.link;

    // d3 layouts & behaviors
    this.tick = this.makeTick();
    this.force = this.makeForce();
    this.zoom = this.makeZoom();
    this.drag = this.makeDrag();

    // event handlers
    this.nodeClick = this.makeNodeClick();

    /**
     * Construction
     */

    this.init();

    /**
     * Global events
     */

    var self = this;
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
    this.svg = d3.select(this.containerEl)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height);
    this.rect = this.svg
        .append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .call(this.zoom)
        .on('dblclick.zoom', null);
    this.group = this.svg
        .append('g');
    this.link = this.group
        .append('svg:g')
        .attr('class', 'links')
        .selectAll('line.link');
    this.node = this.group
        .append('svg:g')
        .attr('class', 'nodes')
        .selectAll('g.node');

    // link arrow markers
    this.svg.append('defs')
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
            .style('fill', '#AAA');
};

ForceGraph.prototype.updateSize = function () {
    this.width = this.containerEl.clientWidth;
    this.height = this.containerEl.clientHeight;

    // NOTE TODO FIXME
    // this is the worst solution to the problem
    // for the love of god, find a better solution
    if (!(this.width && this.height)) {
        console.error('BAD! graph size updating with no container size');
        return;
    }

    this.svg
        .attr('width', this.width)
        .attr('height', this.height);
    this.force
        .size([this.width, this.height])
        .start();
};

ForceGraph.prototype.updateCurrentNode = function () {
    var currentNode = this.ng.session.getCurrentNode();
    this.node.classed('active', function (d) {
        return d.uuid === currentNode.uuid;
    });
};

ForceGraph.prototype.updateNodesAndLinks = function () {

    // NOTE TODO FIXME
    // this is the worst solution to the problem
    // for the love of god, find a better solution
    if (!(this.width && this.height)) {
        console.error('BAD! graph nodes+links updating with no container size');
        return;
    }

    // grab copies of nodes & links from angular
    var nodes = this.ng.session.getNodes().slice();
    var links = this.ng.session.getLinks().slice();

    // give nodes starting positions
    var centerX = this.width / 2;
    var centerY = this.height / 2;
    nodes.forEach(function (node) {
        if (!(node.x || node.y)) {
            node.x = centerX + (Math.random() * 5);
            node.y = centerY + (Math.random() * 5);
        }
    });

    // add graph properties
    this.force.nodes(nodes);
    this.force.links(links);

    // update link elements
    this.link = this.link.data(links, function (d) { return d.uuid; });
    this.link.exit().remove();
    var newLink = this.link
        .enter()
            .append('svg:line')
            .attr('class', 'link')
            .style('marker-end', 'url(#arrow)')
            .classed('linkback', function (d) { return d.linkback; });

    // update node elements
    this.node = this.node.data(nodes, function (d) { return d.uuid; });
    this.node.exit().remove();
    var newNode = this.node.enter()
        .append('svg:g')
            .attr('class', 'node')
            .classed('fixed', function (d) { return d.fixed; })
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
    newNode
        .append('svg:circle')
            .attr('r', 9)
            .on('click', this.nodeClick)
            .call(this.drag);
    newNode
        .append('svg:text')
            .attr('class', 'title')
            .attr('dx', 6)
            .attr('dy', -6)
            .text(function (d) { return d.title })
            .on('click', this.nodeClick)
            .call(this.drag);

    // keep things moving
    this.force.start();

};

ForceGraph.prototype.makeTick = function () {
    // cache function creation for tiny optimization
    function x1(d) { return d.source.x; }
    function y1(d) { return d.source.y; }
    function x2(d) { return d.target.x; }
    function y2(d) { return d.target.y; }
    function transform(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    }
    var self = this;
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
            self.ng.sessions.save();
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
                self.ng.sessions.save();
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
            self.ng.session.setCurrentNode(d.uuid);
        }
    };
};

ForceGraph.prototype.toggleNodePin = function (nodeData, nodeSelection) {
    if (!nodeSelection) {
        nodeSelection = this.node
            .filter(function (d) {
                return d.uuid === nodeData.uuid
            });
    }
    nodeData.fixed = !nodeData.fixed;
    nodeSelection.classed('fixed', nodeData.fixed);
    this.force.start();
    this.ng.sessions.save();
};

ForceGraph.prototype.centerOnNode = function (node) {
    if (!node) return;
    var scale = this.zoom.scale();
    var w = this.width;
    var h = this.height;
    var x = node.x * scale;
    var y = node.y * scale;
    var translateX = (w / 2) - x;
    var translateY = (h / 2) - y;
    this.zoom.translate([translateX, translateY]);
    this.zoom.event(this.rect.transition().duration(600));
};
