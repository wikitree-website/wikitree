(function() {
    angular.module('wikitree.main.menu.session').

        directive('session', function() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "js/angular/main/menu/session/session.template.html",
                controller: 'sessionController'
            }
        });

})();
