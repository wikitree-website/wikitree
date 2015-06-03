(function() {
    angular.module('wikitree.session.menu').

        directive('menu', [function() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: '/js/angular/session/menu/menu.template.html',
                controller: 'menuController'
            }
        }]);
})();
