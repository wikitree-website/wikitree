function HomeGraph(containerEl) {

    this.containerEl = containerEl;
    this.width = containerEl.clientWidth;
    this.height = containerEl.clientHeight;

    this.svg;
    this.group;
    this.node;
    this.link;

    this.isDragging = false;

    this.tick = this.makeTick();
    this.force = this.makeForce();
    this.zoom = this.makeZoom();
    this.drag = this.makeDrag();

    this.init();

    var self = this;
    d3.select(window).on('resize', function () {
        self.updateSize();
    });

}

HomeGraph.prototype.init = function () {
    this.svg = d3.select(this.containerEl)
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

HomeGraph.prototype.updateSize = function () {
    this.width = this.containerEl.clientWidth;
    this.height = this.containerEl.clientHeight
    this.svg
        .attr('width', this.width)
        .attr('height', this.height);
    this.force
        .size([this.width, this.height])
        .resume();
};

HomeGraph.prototype.updateNodesAndLinks = function (nodes, links) {

    nodes = nodes.slice();
    links = links.slice();

    console.log('home update');

    this.force.nodes(nodes);
    this.force.links(links);

    // update link elements
    this.link = this.link.data(links);
    this.link.exit().remove();
    var newLink = this.link
        .enter()
            .append('svg:line')
            .attr('class', 'link');
            // .style('marker-end', 'url(#arrow)');

    // update node elements
    this.node = this.node.data(nodes);
    this.node.exit().remove();
    var newNode = this.node
        .enter()
            .append('svg:g')
            .attr('class', 'node')
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
    newNode
        .append('svg:circle')
            .attr('r', 18)
            .attr('class', 'disc')
            .call(this.drag);

    // keep things moving
    this.force.start();

};

HomeGraph.prototype.makeTick = function () {
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

HomeGraph.prototype.makeForce = function () {
    var self = this;
    return d3.layout.force()
        .size([this.width, this.height])
        .linkDistance(60)
        .charge(-1200)
        .gravity(0.2)
        .friction(0.4)
        .theta(0.01)
        .on('tick', this.tick);
};

HomeGraph.prototype.makeZoom = function () {
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

HomeGraph.prototype.makeDrag = function () {
    var self = this;
    return d3.behavior.drag()
        .on('dragstart', function (d, i) {
            d3.event.sourceEvent.stopPropagation();
        })
        .on('drag', function (d, i) {
            if (!self.isDragging) {
                self.isDragging = true;
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
            if (self.isDragging) {
                self.tick();
                self.isDragging = false;
            }
        });
};
