(function() {
    angular.module('wikitree.session.menu.session_tile').

        directive('escpress', [function () {
            return {
                link: function (scope, element, attrs) {
                    element.bind("keydown keypress", function (event) {
                        if (event.which === 27) {
                            scope.$apply(function () {
                                scope.$eval(attrs.escpress);
                            });

                            event.preventDefault();
                        }
                    });
                }
            }
        }]);

})();
