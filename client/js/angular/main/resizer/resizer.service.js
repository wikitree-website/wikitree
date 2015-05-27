(function() {
    angular.module('wikitree').
        factory('Resizer', [
            function () {
                var Resizer = {};
                Resizer.MIN_REMAINDER = 120;
                Resizer.MIN_SIZE = 300;
                Resizer.ratio = 3/5;
                Resizer.size = Resizer.ratio * window.innerWidth;
                return Resizer;
            }
        ]
    );
})();
