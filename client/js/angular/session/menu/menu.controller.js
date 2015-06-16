(function() {
    angular.module('wikitree.session.menu').

        controller('menuController', [
            '$rootScope',
            '$scope',
            '$location',
            'Search',
            'Sessions',
            function($rootScope, $scope, $location, Search, Sessions) {

                $scope.sessions = Sessions.index;
                $scope.active = Sessions.active;
                $scope.$watch(function () {
                    return Sessions.active;
                }, function (value) {
                    $scope.active = value;
                });

                $scope.open = false;

                $scope.goHome = function() {
                    $location.path('/welcome');
                };

                $scope.toggleMenu = function () {
                    $scope.open = !$scope.open;
                    if ($scope.open) {
                        $rootScope.$broadcast('menu:open');
                    } else {
                        $rootScope.$broadcast('menu:close');
                    }
                };

                $scope.sortableOptions = {
                    update: function(e, ui) {
                        $scope.$broadcast('session:cancel_edit');
                        $rootScope.$broadcast('session:sort', {
                            start: ui.item.sortable.index,
                            stop:  ui.item.sortable.dropindex
                        });
                        console.log('index', ui.item.sortable.index, 'moved to', ui.item.sortable.dropindex);
                    }
                };

                $scope.addNoteNode = function () {
                    $rootScope.$broadcast('request:graph:add_note_node');
                };

                $scope.locateCurrentNode = function () {
                    $rootScope.$broadcast('request:graph:locate_current_node');
                };

        }]);
})();

