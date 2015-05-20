(function() {
    angular.module('wikitree', [
        'ngRoute',
        'LocalStorageModule',
        'ui.bootstrap.alert',
        'wikitree.home',
        'wikitree.main',
        'wikitree.search'
    ]).
    config(['localStorageServiceProvider', function(localStorageServiceProvider) {
        localStorageServiceProvider.setPrefix('Wikitree');
    }]);
})();