(function() {
    angular.module('wikitree.search').

        controller('searchController', ['$scope', '$location', 'Search', 'Sessions', 'CurrentSession',
            function($scope, $location, Search, Sessions, CurrentSession) {

                $scope.search = Search;
                $scope.inputText = '';

                $scope.tryEnter = function ($event) {
                    if ($event.keyCode === 13) {
                        $scope.goToArticle();
                    }
                };

                $scope.goToArticle = function (isButton) {
                    if ($scope.inputText) {

                        // grab search term from input
                        Search.term = $scope.inputText;

                        // reset input text to blank
                        $scope.inputText = '';

                        // if not main, go to main with new sesh
                        if ($location.path() != '/main') {
                            $location.path('/main');
                            Sessions.new(Search.term);
                        }

                        // did they click the button?
                        if (isButton) {
                            // button = search results
                            CurrentSession.handleTitleSearch({
                                title: Search.term
                            });
                        } else {
                            // no button = attempt article
                            CurrentSession.handleTitle({
                                title: Search.term
                            });
                        }
                    }
                };
            }]);

})();
