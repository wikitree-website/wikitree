(function() {
    angular.module('wikitree').

        config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
            });

            $routeProvider.
                when('/', {
                    templateUrl: '/js/angular/home/home.template.html',
                    controller: 'home_controller',
                    resolve: {
                        is_new: ['Sessions', function (Sessions) {
                            return Sessions.is_new();
                        }]
                    }
                }).
                when('/welcome', {
                    templateUrl: '/js/angular/home/home.template.html',
                    controller: 'home_controller'
                }).
                when('/session/:uuid', {
                    templateUrl: '/js/angular/session/session.template.html',
                    controller: 'session_controller',
                    controllerAs: 'session',
                    resolve: {
                        init_session: ['Sessions', '$route', function (Sessions, $route) {
                            return Sessions.restore($route.current.params.uuid);
                        }]
                    }
                }).
                when('/new/:term/:search?', {
                    templateUrl: '/js/angular/session/session.template.html',
                    controller: 'session_controller',
                    controllerAs: 'session',
                    resolve: {
                        init_session: ['Sessions', '$route', function (Sessions, $route) {
                            return Sessions.new($route.current.params.term);
                        }]
                    }
                }).
                otherwise({ redirectTo: '/' });
        }]);

})();