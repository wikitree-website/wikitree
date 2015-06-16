(function () {
    angular.module('wikitree.session.graph').
        controller('graphController', [
            '$scope',
            'Resizer',
            function ($scope, Resizer) {

            	// for graph position
                $scope.positionRight = Resizer.size + 'px';


                /**
                 * Global events
                 */

                // handle "locate current node" button
                $scope.$on('request:graph:locate_current_node', function () {
                    var node = $scope.session.get_current_node();
                    $scope.graph.centerOnNode(node);
                });

                // handle "locate node" button
                $scope.$on('request:graph:locate_node', function (e, node) {
                    $scope.graph.centerOnNode(node);
                });

                // handle "add note node" button
                $scope.$on('request:graph:add_note_node', function () {
                    $scope.session.addNewNoteNode();
                });

                // handle map/reader split resize
                $scope.$on('split:resize', function (e, data) {
                    $scope.positionRight = Resizer.size + 'px';
                    setTimeout(function () {
                        $scope.graph.updateSize();
                    }, 1);
                });

                // handle model update (nodes + links)
                $scope.$on('update:nodes+links', function () {
                    var nodes = $scope.session.get_nodes();
                    var links = $scope.session.get_links();
                    $scope.graph.updateNodesAndLinks(nodes, links);
                });

                // handle model update (current node)
                $scope.$on('update:currentnode', function () {
                    var node = $scope.session.get_current_node();
                    $scope.graph.updateCurrentNode(node);
                });

                // handle model update (note node content)
                $scope.$on('update:note-node-content', function (e, node) {
                    $scope.graph.updateNoteNodeContent(node);
                });


                /**
                 * Scope methods
                 */

                $scope.setCurrentNode = function (nodeId) {
                    $scope.session.set_current_node_id(nodeId);
                };

                $scope.setCurrentNoteNode = function (nodeId) {
                    $scope.session.setCurrentNoteNodeId(nodeId);
                };

                $scope.removeNode = function (nodeId) {
                    var node = $scope.session.getNode(nodeId);
                    if (!node) return;
                    if (window.confirm('Remove the node "' + node.name + '" from your session?')) {
                        $scope.session.removeNode(node.uuid);
                    }
                };

                $scope.removeLink = function (linkId) {
                    var link = $scope.session.getLink(linkId);
                    if (!link) return;
                    var nodeA = link.source;
                    var nodeB = link.target;
                    if (window.confirm('Remove the link between "' + nodeA.name + '" and "' + nodeB.name + '" from your session?')) {
                        $scope.session.removeLinkPair(link.uuid);
                    }
                };

                $scope.addLink = function (sourceId, targetId) {
                    $scope.session.addLink(sourceId, targetId);
                };

            }
        ]);
})();
