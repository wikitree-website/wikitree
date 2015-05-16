(function() {
    angular.module('wikitree.search').

        controller('searchController', ['$scope','$location','Search', 'Sessions', 'CurrentSession',
            function($scope, $location, Search, Sessions, CurrentSession) {
                $scope.search = Search;
                $scope.searchBar = "";
                $scope.empty = false;

                $scope.onSelect = function($item, $model, $label) {
                    $scope.search.term = $item;
                    $scope.goToArticle();
                };

                $scope.goToArticle = function() {
                    if (!$scope.searchBar) {
                        $scope.empty = true;
                    }
                    else {
                        $scope.empty = false;
                        Search.term = $scope.searchBar;
                        if ($location.path() != '/main') {
                            $location.path('/main');
                            Sessions.new(Search.term);
                        }
                        CurrentSession.handleTitle({
                            title: Search.term
                        });
                    }
                };
            }]);

})();
