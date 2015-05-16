(function() {
    angular.module('wikitree.main.graph').

        directive('graph', ['$rootScope', 'CurrentSession', 'Sessions', 'Articles',
            function($rootScope, CurrentSession, Sessions, Articles) {

                var link = function(scope, element, attrs) {

                    // make d3 graph instance
                    var $graph = $('#new-map');
                    var graph = new ForceGraph(
                        $graph[0],
                        CurrentSession,
                        Sessions,
                        Articles
                    );

                    // handle "toggle node pin" button
                    $rootScope.$on('request:graph:toggle_node_pin', function () {
                        graph.toggleNodePin(CurrentSession.getCurrentNode());
                    });

                    // handle "locate current node" button
                    $rootScope.$on('request:graph:locate_current_node', function () {
                        graph.centerOnNode(CurrentSession.getCurrentNode());
                    });

                    // handle model update (nodes + links)
                    CurrentSession.addListener('update:nodes+links', function () {
                        graph.updateNodesAndLinks();
                    });

                    // handle model update (current node)
                    CurrentSession.addListener('update:currentnode', function () {
                        graph.updateCurrentNode();
                    });

                    // handle reader resize
                    $rootScope.$on('split:resize', function (e, data) {
                        $graph.css({ right: data });
                        graph.updateSize();
                    });

                    // handle menu open / close

                    function animateGraphLeft(lefts) {
                        (function animateFrame() {
                            if (!lefts.length) {
                                console.log('done');
                                return;
                            }
                            var left = lefts.pop();
                            $graph.css({ left: left });
                            graph.updateSize();
                            setTimeout(function () {
                                requestAnimationFrame(animateFrame);
                            }, 1);
                        })();
                    }

                    $rootScope.$on('menu:open', function (e) {
                        var lefts = [];
                        for (var left = 120; left >= 0; left -= 10) {
                            lefts.push(left);
                        }
                        animateGraphLeft(lefts);
                    });

                    $rootScope.$on('menu:close', function (e) {
                        var lefts = [];
                        for (var left = 0; left <= 120; left += 10) {
                            lefts.push(left);
                        }
                        animateGraphLeft(lefts);
                    });

                };

                return {
                    restrict: 'E',
                    replace: true,
                    templateUrl: "js/angular/main/graph/graph.template.html",
                    scope: {},
                    link: link
                }
        }]);
})();
