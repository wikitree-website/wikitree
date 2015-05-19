(function() {
    angular.module('wikitree.main.menu').

        directive('menu', [function() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'js/angular/main/menu/menu.template.html',
                controller: 'menuController'
            }
        }]);
})();
