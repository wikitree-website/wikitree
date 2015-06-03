(function() {
    angular.module('wikitree.session.menu.session_tile').

        controller('sessionController', ['$scope', '$location', 'Sessions', function($scope, $location, Sessions) {

            $scope.editing = false;

            $scope.edit = function() {
                console.log('edit');
                if (!$scope.editing) {
                    $scope.$parent.$broadcast('session:cancel_edit');
                }
                $scope.editing = !$scope.editing;
                $scope.$parent.$broadcast('focus');
            };


            $scope.cancel_edit = function () {
                $scope.$parent.$broadcast('session:cancel_edit');
            };

            $scope.$on('session:cancel_edit', function() {
                $scope.session.rename = $scope.session.name;
                $scope.editing = false;
            });

            $scope.select = function(idx) {
                //Sessions.restore(idx);
                $scope.$parent.$broadcast('session:cancel_edit');
                $location.path('/session/'+$scope.session.uuid);
            };

            $scope.delete = function(idx) {
                Sessions.delete(idx);
                $scope.$parent.$broadcast('session:cancel_edit');
            };

            $scope.rename = function() {
                $scope.session.name = $scope.session.rename;
                $scope.session.rename = $scope.session.name;
                $scope.editing = false;
            };

        }]);
})();