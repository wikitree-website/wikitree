(function() {
    angular.module('wikitree.search').

        directive('search', [function() {
            return {
                restrict: 'E',
                templateUrl: "js/angular/search/search.template.html",
                controller: 'searchController',
                scope: {
                    large: '@'
                }
            }
        }]);

})();
