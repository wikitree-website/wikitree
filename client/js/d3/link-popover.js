function LinkPopover(containerEl, scope, link, linkSelect) {
    var self = this;

    // properties
    self.containerEl = containerEl;
    self.scope = scope;
    self.link = link;
    self.linkSelect = linkSelect;
    self.linkbackSelect = undefined;
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

LinkPopover.prototype.makeElement = function () {
    var self = this;
    // create popover
    self.$el = $(
        '<div class="link-popover popover">' +
            '<div class="popover-content">' +
                '<div class="btn-group" role="group" aria-label="Link controls">' +
                    '<button type="button" class="del-button btn btn-default btn-xs">' +
                        '<i class="fa fa-unlink"></i>' +
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

LinkPopover.prototype.addEventListeners = function () {
    var self = this;
    // hover on
    self.$el.on('mouseover', function () {
        self.hovered = true;
    });
    // hover off
    self.$el.on('mouseout', function () {
        self.hovered = false;
        setTimeout(function () {
            if (!self.link.hovered) {
                self.hide();
            }
        }, 1);
    });
    // delete button
    self.$el.find('.del-button').on('click', function () {
        self.scope.removeLink(self.link.uuid);
    });
};

LinkPopover.prototype.addLinkback = function (linkbackSelect) {
    var self = this;
    self.linkbackSelect = linkbackSelect;
};

LinkPopover.prototype.show = function () {
    var self = this;
    setTimeout(function () {
        if (!self.hidden) return;
        self.hidden = false;
        self.$el.show();
        self.linkSelect.classed('hovered', true);
        if (self.linkbackSelect) {
            self.linkbackSelect.classed('hovered', true);
        }
    }, 1);
};

LinkPopover.prototype.hide = function () {
    var self = this;
    setTimeout(function () {
        if (self.hovered) return;
        if (self.hidden) return;
        self.hidden = true;
        self.$el.hide();
        self.linkSelect.classed('hovered', false);
        if (self.linkbackSelect) {
            self.linkbackSelect.classed('hovered', false);
        }
    }, 1);
};

LinkPopover.prototype.position = function (x, y) {
    var self = this;
    self.$el.css({
        top: y - self.halfheight,
        left: x - self.halfwidth
    });
};
