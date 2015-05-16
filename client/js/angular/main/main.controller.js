(function() {
    angular.module('wikitree.main').

        controller('mainController', ['$scope', 'CurrentSession',
            function($scope, CurrentSession) {
                $scope.searchTerm = CurrentSession.searchTerm;
            }]);

})();