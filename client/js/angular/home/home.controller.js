(function() {
    angular.module('wikitree.home').

        controller('home_controller', ['$scope', '$location', 'Utilities',
            function($scope, $location, Utilities) {

                var $graph = $('#home-graph');
                var graph = new HomeGraph($graph[0]);

                function Node(x, y) {
                    this.uuid = Utilities.makeUUID();
                    this.index = undefined; // the zero-based index of the node within the nodes array.
                    this.x = x; // the x-coordinate of the current node position.
                    this.y = y; // the y-coordinate of the current node position.
                    this.px = undefined; // the x-coordinate of the previous node position.
                    this.py = undefined; // the y-coordinate of the previous node position.
                    this.fixed = undefined; // a boolean indicating whether node position is locked.
                    this.weight = undefined; // the node weight; the number of associated links.
                }

                function Link(source, target) {
                    this.uuid = Utilities.makeUUID();
                    this.source = source;
                    this.target = target;
                }

                var nodes = [];
                var links = [];

                var nodesById = {};
                var linksByNodeIds = {};

                var requestID = null;
                var timeoutID = null;

                var limit = 200;
                var count = 0;

                /**
                 * Grow network
                 */

                function addRandomNode() {

                    if (count > limit) {
                        // big crunch-> linkAllNodes();
                        return;
                    }

                    count++;

                    if (!nodes.length) {
                        nodes.push(new Node(
                            window.innerWidth / 2,
                            window.innerHeight / 2
                        ));
                    } else {

                        var sourceIndex = Math.floor(Math.random() * nodes.length);
                        var source = nodes[sourceIndex];

                        var node = new Node(
                            source.x + Utilities.makeJitter(10),
                            source.y + Utilities.makeJitter(10)
                        );

                        var link = new Link(source, node);

                        nodes.push(node);
                        links.push(link);

                        nodesById[node.uuid] = node;
                        linksByNodeIds[source.uuid + ',' + node.uuid] = link;

                    }

                    graph.updateNodesAndLinks(nodes, links);

                    timeoutID = setTimeout(function() {
                        requestID = window.requestAnimationFrame(addRandomNode);
                    }, 200 + (Math.random() * 200));

                }


                /**
                 * Bind network
                 */

                function linkAllNodes() {

                    var pairs = [];
                    var pairsByIds = {};

                    nodes.forEach(function (nodeA) {
                        nodes.forEach(function (nodeB) {
                            if (nodeA.uuid === nodeB.uuid) return;
                            if (pairsByIds[nodeA.uuid + ',' + nodeB.uuid]) return;
                            if (pairsByIds[nodeB.uuid + ',' + nodeA.uuid]) return;
                            if (linksByNodeIds[nodeA.uuid + ',' + nodeB.uuid]) return;
                            if (linksByNodeIds[nodeB.uuid + ',' + nodeA.uuid]) return;
                            var pair = [nodeA, nodeB];
                            pairsByIds[nodeA.uuid + ',' + nodeB.uuid] = pair;
                            pairs.push(pair);
                        });
                    });

                    pairs = Utilities.shuffleArr(pairs);

                    function linkPair() {
                        var pair = pairs.pop();
                        var nodeA = pair[0];
                        var nodeB = pair[1];
                        var link = new Link(nodeA, nodeB);
                        links.push(link);
                        linksByNodeIds[nodeA.uuid + ',' + nodeB.uuid] = link;
                        graph.updateNodesAndLinks(nodes, links);
                    }

                    function timeLoop() {
                        linkPair();
                        timeoutID = setTimeout(function() {
                            requestID = window.requestAnimationFrame(timeLoop);
                        }, 600 + (Math.random() * 600));
                    }

                    timeLoop();
                }


                /**
                 * Beginning
                 */

                timeoutID = setTimeout(function() {
                    requestID = window.requestAnimationFrame(addRandomNode);
                }, 600);


                /**
                 * End
                 */

                $scope.$on('$destroy', function () {
                    clearTimeout(timeoutID);
                    window.cancelAnimationFrame(requestID);
                });



            }]);
})();
