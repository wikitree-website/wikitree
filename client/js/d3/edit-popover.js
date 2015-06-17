function EditPopover(containerEl, scope, node) {
    var self = this;

    // properties
    self.containerEl = containerEl;
    self.scope = scope;
    self.node = node;
    self.$el = undefined;
    self.$name = undefined;
    self.$body = undefined;
    self.width = undefined;
    self.height = undefined;
    self.halfwidth = undefined;
    self.halfheight = undefined;
    self.hidden = false;

    // contruction
    self.makeElement();
    self.addEventListeners();

}

EditPopover.prototype.makeElement = function () {
    var self = this;
    // create popover
    self.$el = $(
        '<div class="graph-popover edit popover right">' +
            '<div class="arrow"></div>' +
            '<div class="popover-content">' +
                '<div class="upper">' +
                    '<div class="name">' +
                        '<input type="text" class="form-control input-sm" placeholder="Add title...">' +
                    '</div>' +
                    '<div class="controls">' +
                        '<div class="btn-group" role="group" aria-label="Editor controls">' +
                            '<button type="button" class="cancel-button btn btn-danger btn-xs">' +
                                '<i class="fa fa-fw fa-close"></i>' +
                            '</button>' +
                            '<button type="button" class="confirm-button btn btn-success btn-xs">' +
                                '<i class="fa fa-fw fa-check"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="lower">' +
                    '<textarea rows="5" class="form-control input-sm" placeholder="Add caption..."></textarea>' +
                '</div>' +
            '</div>' +
        '</div>'
    );
    // append to container element
    $(self.containerEl).append(self.$el);
    // grab inputs
    self.$name = self.$el.find('input');
    self.$body = self.$el.find('textarea');
    // measure self
    self.width = self.$el.outerWidth();
    self.height = self.$el.outerHeight();
    self.halfwidth = self.width / 2;
    self.halfheight = self.height / 2;
    // hide self
    self.hide();
};

EditPopover.prototype.addEventListeners = function () {
    var self = this;
    // cancel edit button
    self.$el.find('.cancel-button').on('click', function () {
        self.hide();
    });
    // confirm edit button
    self.$el.find('.confirm-button').on('click', function () {
        self.save();
        self.hide();
    });
    // input enter press
    self.$name.on('keypress', function (e) {
        switch (e.which) {
            case 13:
                // save on enter
                self.save();
                self.hide();
                break;
        }
    });
};

EditPopover.prototype.load = function () {
    var self = this;
    self.$name.val(self.node.name || '');
    self.$body.val(self.node.body || '');
};

EditPopover.prototype.save = function () {
    var self = this;
    var name = self.$name.val() || '';
    var body = self.$body.val() || '';
    self.scope.$apply(function () {
        self.scope.session.updateNoteNodeContent(
            self.node.uuid,
            name,
            body
        );
    });
};

EditPopover.prototype.show = function () {
    var self = this;
    setTimeout(function () {
        if (!self.hidden) return;
        self.hidden = false;
        self.load();
        self.$el.show();
    }, 1);
};

EditPopover.prototype.hide = function () {
    var self = this;
    setTimeout(function () {
        if (self.hidden) return;
        self.hidden = true;
        self.$el.hide();
    }, 1);
};

EditPopover.prototype.toggle = function () {
    var self = this;
    if (self.hidden) {
        self.show();
    } else {
        self.hide();
    }
};

EditPopover.prototype.position = function (x, y) {
    var self = this;
    self.$el.css({
        top: y - 22,
        left: x - 2
    });
};
