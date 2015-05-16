(function() {
    angular.module('wikitree', [
        'ngRoute',
        'LocalStorageModule',
        'ui.bootstrap.alert',
        'wikitree.home',
        'wikitree.main',
        'wikitree.search'
    ]).
    config(function(localStorageServiceProvider) {
        localStorageServiceProvider.setPrefix('Wikitree');
    });
})();