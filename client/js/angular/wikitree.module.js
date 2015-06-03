(function() {
    angular.module('wikitree', [
        'ngRoute',
        'LocalStorageModule',
        'ui.bootstrap.alert',
        'wikitree.home',
        'wikitree.session',
        'wikitree.search'
    ]).
    config(['localStorageServiceProvider', function(localStorageServiceProvider) {
        localStorageServiceProvider.setPrefix('Wikitree');
    }]);
})();