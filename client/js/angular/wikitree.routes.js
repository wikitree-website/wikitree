(function() {
    angular.module('wikitree').

        config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
            $routeProvider.
                when('/', {
                    templateUrl: 'js/angular/home/home.template.html',
                    controller: "homeController"
                }).
                when('/main', {
                    templateUrl: 'js/angular/main/main.template.html',
                    controller: "mainController"
                }).
                otherwise({ redirectTo: '/' });

            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
            });
        }]);

})();