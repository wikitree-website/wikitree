(function() {
    angular.module('wikitree.main.menu.session').

        directive('focus', ['$timeout', function($timeout) {
            return {
                scope : {
                    trigger : '@focus'
                },
                link : function(scope, element) {
                    scope.$watch('trigger', function(value) {
                        if (value === "true") {
                            $timeout(function() {
                                element[0].focus();
                            });
                        }
                    });
                }
            };
        }]);

})();













