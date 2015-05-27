(function() {
    angular.module('wikitree.main.graph').
        directive('graph', [function() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'js/angular/main/graph/graph.template.html',
                controller: 'graphController',
                link: function(scope, element) {
                    scope.graph = new ForceGraph(
                        element[0],
                        scope
                    );
                }
            }
        }]);
})();
