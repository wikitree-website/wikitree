(function() {
    angular.module('wikitree.search').

        directive('search', [function() {
            return {
                restrict: 'E',
                templateUrl: "/js/angular/search/search.template.html",
                controller: 'searchController',
                link: function($scope, $element, $attributes) {
                    $scope.large = $attributes.large;
                    $scope.new_session = $attributes.newSession;
                }
            }
        }]);

})();
