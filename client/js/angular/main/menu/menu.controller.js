(function() {
    angular.module('wikitree.main.menu').

        controller('menuController', [
            '$rootScope',
            '$scope',
            '$location',
            'Search',
            'Sessions',
            'CurrentSession',
            function($rootScope, $scope, $location, Search, Sessions, CurrentSession) {

                if (Search.term === '') {
                    Sessions.restore(Sessions.active);
                }

                $scope.sessions = Sessions.index;
                $scope.active = Sessions.active;
                $scope.$watch(function () {
                    return Sessions.active;
                }, function (value) {
                    $scope.active = value;
                });

                $scope.open = false;

                $scope.goHome = function() {
                    Sessions.save();
                    $location.path('/');
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
                }

                $scope.toggleNodePin = function () {
                    $rootScope.$broadcast('request:graph:toggle_node_pin');
                };

                $scope.removeCurrentNode = function () {
                    var node = CurrentSession.getCurrentNode();
                    if (window.confirm('Remove the article "' + node.title + '" from your session?')) {
                        CurrentSession.removeNode(node.uuid);
                    }
                };

                $scope.locateCurrentNode = function () {
                    $rootScope.$broadcast('request:graph:locate_current_node');
                };

        }]);
})();

