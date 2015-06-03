(function() {
    angular.module('wikitree.session.menu.session_tile').

        directive('enterpress', function () {
            return {
                link: function (scope, element, attrs) {
                    element.bind("keydown keypress", function (event) {
                        if (event.which === 13) {
                            scope.$apply(function () {
                                scope.$eval(attrs.enterpress);
                            });

                            event.preventDefault();
                        }
                    });
                }
            }


        });

})();