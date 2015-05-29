(function () {
    angular.module('wikitree.main.graph').
        controller('graphController', [
            '$scope',
            'Resizer',
            'CurrentSession',
            'Sessions',
            function ($scope, Resizer, CurrentSession, Sessions) {

            	// for graph position
                $scope.positionRight = Resizer.size + 'px';


                /**
                 * Global events
                 */

                // handle "locate current node" button
                $scope.$on('request:graph:locate_current_node', function () {
                    var node = CurrentSession.getCurrentNode();
                    $scope.graph.centerOnNode(node);
                });

                // handle map/reader split resize
                $scope.$on('split:resize', function (e, data) {
                    $scope.positionRight = Resizer.size + 'px';
                    $scope.graph.updateSize();
                });

                // handle model update (nodes + links)
                $scope.$on('update:nodes+links', function () {
                	var nodes = CurrentSession.getNodes().slice();
                    var links = CurrentSession.getLinks().slice();
                    $scope.graph.updateNodesAndLinks(nodes, links);
                });

                // handle model update (current node)
                $scope.$on('update:currentnode', function () {
                    var node = CurrentSession.getCurrentNode();
                    $scope.graph.updateCurrentNode(node);
                });


                /**
                 * Scope methods
                 */

                $scope.saveSession = function () {
                    Sessions.save();
                };

                $scope.setCurrentNode = function (nodeId) {
                    CurrentSession.setCurrentNode(nodeId);
                };

                $scope.removeNode = function (nodeId) {
                    var node = CurrentSession.getNode(nodeId);
                    if (!node) return;
                    if (window.confirm('Remove the node "' + node.name + '" from your session?')) {
                        CurrentSession.removeNode(node.uuid);
                    }
                };


            }
        ]);
})();
