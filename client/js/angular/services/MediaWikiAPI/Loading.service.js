(function() {
    angular.module('wikitree').
        factory('Loading', [
        	'$rootScope',
            function ($rootScope) {

                var Loading = {};

                Loading.count = 0;

                $rootScope.$on('mediawikiapi:loadstart', function () {
                    Loading.count++;
                });

                $rootScope.$on('mediawikiapi:loadend', function () {
                    Loading.count--;
                    // protect from bad timing
                    if (Loading.count < 0) {
                        Loading.count = 0;
                    }
                });

                return Loading;
            }
        ]
    );
})();
