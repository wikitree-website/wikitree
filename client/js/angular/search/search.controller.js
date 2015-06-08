(function() {
    angular.module('wikitree.search').

        controller('searchController', ['$scope', '$location', 'Search',
            function($scope, $location, Search) {

                $scope.inputText = '';

                $scope.get_suggestions = function (term) {
                    return Search.get_suggestions(term);
                };

                $scope.tryEnter = function ($event) {
                    if ($event.keyCode === 13) {
                        $event.preventDefault();
                        $scope.start_search(true);
                    }
                };

                $scope.start_search = function (isButton) {
                    var term = $scope.inputText;

                    //if (term) {
                    //    if ($scope.new_session) {
                    //        $location.path('/new/' + term);
                    //    } else {
                    //        $scope.session.do_search(term)
                    //    }
                    //}

                    console.log('is_button', isButton);

                    if (term) {
                        if ($scope.new_session) {
                            if (isButton) {
                                $location.path('/new/' + term + '/true');
                            } else {
                                $location.path('/new/' + term);
                            }
                        } else {
                            if (isButton) {
                                $scope.session.do_search(term, null, null, true);
                            } else {
                                $scope.session.do_search(term);
                            }
                        }
                    }

                    $scope.inputText = '';

                };
            }]);

})();
