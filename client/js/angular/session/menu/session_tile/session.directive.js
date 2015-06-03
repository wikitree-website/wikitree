(function() {
    angular.module('wikitree.session.menu.session_tile').

        directive('session', [function() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "/js/angular/session/menu/session_tile/session_tile.template.html",
                controller: 'sessionController'
            }
        }]);

})();
