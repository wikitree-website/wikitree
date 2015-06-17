function NodePopover(containerEl, scope, node, nodeSelect) {
    var self = this;

    // properties
    self.containerEl = containerEl;
    self.scope = scope;
    self.node = node;
    self.nodeSelect = nodeSelect;
    self.$el = undefined;
    self.width = undefined;
    self.height = undefined;
    self.halfwidth = undefined;
    self.halfheight = undefined;
    self.hidden = false;
    self.hovered = false;

    // contruction
    self.makeElement();
    self.addEventListeners();

}

NodePopover.prototype.makeElement = function () {
    var self = this;
    // create popover
    self.$el = $(
        '<div class="graph-popover node popover bottom">' +
            '<div class="arrow"></div>' +
            '<div class="popover-content">' +
                '<div class="btn-group" role="group" aria-label="Node controls">' +
                    '<button type="button" class="pin-button btn btn-default btn-xs">' +
                        '<i class="fa fa-fw fa-thumb-tack"></i>' +
                    '</button>' +
                    '<button type="button" class="del-button btn btn-default btn-xs">' +
                        '<i class="fa fa-fw fa-trash-o"></i>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>'
    );
    // append to container element
    $(self.containerEl).append(self.$el);
    // measure self
    self.width = self.$el.outerWidth();
    self.height = self.$el.outerHeight();
    self.halfwidth = self.width / 2;
    self.halfheight = self.height / 2;
    // hide self
    self.hide();
};

NodePopover.prototype.addEventListeners = function () {
    var self = this;
    // hover on
    self.$el.on('mouseenter', function () {
        self.hovered = true;
    });
    // hover off
    self.$el.on('mouseleave', function () {
        self.hovered = false;
        setTimeout(function () {
            self.hide();
        }, 50);
    });
    // pin button
    self.$el.find('.pin-button').on('click', function () {
        self.scope.graph.toggleNodePin(self.node);
        self.hide(true);
    });
    // delete button
    self.$el.find('.del-button').on('click', function () {
        self.scope.removeNode(self.node.uuid);
    });
};

NodePopover.prototype.show = function () {
    var self = this;
    setTimeout(function () {
        if (!self.hidden) return;
        self.hidden = false;
        self.$el.show();
        self.nodeSelect.classed('hovered', true);
    }, 1);
};

NodePopover.prototype.hide = function (forceful) {
    var self = this;

    if (forceful) {
        self._hide();
        return;
    }

    setTimeout(function () {
        if (self.hidden) return;
        if (self.hovered) return;
        if (self.node.hovered) return;
        self._hide();
    }, 100);
};

NodePopover.prototype._hide = function () {
    var self = this;
    self.hidden = true;
    self.hovered = false;
    self.$el.hide();
    self.nodeSelect.classed('hovered', false);
};

NodePopover.prototype.position = function (x, y) {
    var self = this;
    self.$el.css({
        top: y - self.halfheight + 18,
        left: x - self.halfwidth
    });
};
