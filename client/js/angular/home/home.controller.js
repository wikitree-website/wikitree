(function() {
    angular.module('wikitree.home').

        controller('homeController', ['$scope', '$location', 'Utilities',
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

                var requestID = null;
                var timeoutID = null

                var limit = 200;
                var count = 0;

                function addRandomNode() {

                    if (count > limit) return;
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
                    }

                    graph.updateNodesAndLinks(nodes, links);

                    timeoutID = setTimeout(function() {
                        requestID = window.requestAnimationFrame(addRandomNode);
                    }, 200 + (Math.random() * 200));

                }

                timeoutID = setTimeout(function() {
                    requestID = window.requestAnimationFrame(addRandomNode);
                }, 600);

                $scope.$on('$destroy', function () {
                    clearTimeout(timeoutID);
                    window.cancelAnimationFrame(requestID);
                });

            }]);
})();
