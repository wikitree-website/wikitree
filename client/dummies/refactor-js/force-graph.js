function ForceGraph(containerEl) {

    this.width = containerEl.clientWidth;
    this.height = containerEl.clientHeight;

    this.svg;
    this.group;
    this.node;
    this.link;

    this.tick = this.makeTick();
    this.force = this.makeForce();
    this.zoom = this.makeZoom();
    this.drag = this.makeDrag();

    this.nodeSelect = this.makeNodeSelect();
    this.nodeRelease = this.makeNodeRelease();

    this.init(containerEl);

    var self = this;
    d3.select(window).on('resize', function () {
        self.resize(
            containerEl.clientWidth,
            containerEl.clientHeight
        );
    });

}

ForceGraph.getJitter = function (factor) {
    var jitter = factor * Math.random();
    if (Math.random() < 0.5) jitter = -1 * jitter;
    return jitter;
};

ForceGraph.prototype.init = function (containerEl) {
    this.svg = d3.select(containerEl)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height);
    var rect = this.svg
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
};

ForceGraph.prototype.update = function () {

    var nodes = mapModel.getNodes();
    var links = mapModel.getLinks();
    var currentNode = mapModel.getCurrentNode();

    // add graph properties to model objects
    // NOTE this is one of the sketchy parts
    this.force.nodes(nodes);
    this.force.links(links);

    // update link elements
    this.link = this.link.data(links);
    var newLink = this.link
        .enter()
            .append('svg:line')
            .attr('class', 'link');

    // update node elements
    this.node = this.node.data(nodes);
    var newNode = this.node
        .enter()
            .append('svg:g')
            .attr('class', 'node');
    newNode
        .append('svg:circle')
            .attr('r', 9)
            .on('mousedown', this.nodeSelect)
            .on('dblclick', this.nodeRelease)
            .call(this.drag);
    newNode
        .append('svg:text')
            .attr('class', 'title')
            .attr('dx', 6)
            .attr('dy', -6)
            .text(function (d) { return d.article.title })
            .on('mousedown', this.nodeSelect);
    this.node
        .classed('active', function (d) {
            return d.uuid === currentNode.uuid;
        });

    // keep things moving
    this.force.start();

};

ForceGraph.prototype.resize = function (width, height) {
    this.width = width;
    this.height = height;
    this.svg
        .attr('width', this.width)
        .attr('height', this.height);
    this.force
        .size([this.width, this.height])
        .resume();
};

ForceGraph.prototype.makeTick = function () {
    var self = this;
    return function () {
        self.link
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });
        self.node
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
    };
};

ForceGraph.prototype.makeForce = function () {
    return d3.layout.force()
        .size([this.width, this.height])
        .linkDistance(80)
        .charge(-360)
        .gravity(0.03)
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
                d.fixed = true;
                d3.select(this).classed('fixed', true);
                isDragging = true;
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
            }
        });
};

ForceGraph.prototype.makeNodeSelect = function () {
    var self = this;
    return function (d) {
        mapModel.setCurrentNode(d.uuid);
    };
};

ForceGraph.prototype.makeNodeRelease = function () {
    var self = this;
    return function (d) {
        d.fixed = false;
        d3.select(this).classed('fixed', false);
        self.force.start();
    };
};
