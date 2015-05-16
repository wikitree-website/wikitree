(function() {
    angular.module('wikitree.main.menu.session').

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