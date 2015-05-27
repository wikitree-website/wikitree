(function () {
	angular.module('wikitree.main.graph').
		controller('graphController', [
			'$rootScope',
			'$scope',
			'CurrentSession',
			'Sessions',
			function ($rootScope, $scope, CurrentSession, Sessions) {


				/**
				 * Global events
				 */

				// handle "toggle node pin" button
                $rootScope.$on('request:graph:toggle_node_pin', function () {
                	var node = CurrentSession.getCurrentNode();
                    $scope.graph.toggleNodePin(node);
                });

                // handle "locate current node" button
                $rootScope.$on('request:graph:locate_current_node', function () {
                	var node = CurrentSession.getCurrentNode();
                    $scope.graph.centerOnNode(node);
                });

                // handle map/reader split resize
                $rootScope.$on('split:resize', function (e, data) {
                    $($scope.graph.containerEl).css({ right: data });
                    $scope.graph.updateSize();
                });


                /**
                 * Current Session events
                 */

                // handle model update (nodes + links)
                CurrentSession.addListener('update:nodes+links', function () {
                	var nodes = CurrentSession.getNodes().slice();
                	var links = CurrentSession.getLinks().slice();
                    $scope.graph.updateNodesAndLinks(nodes, links);
                });

                // handle model update (current node)
                CurrentSession.addListener('update:currentnode', function () {
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


			}
		]);
})();
