(function() {
    angular.module('wikitree.main.resizer').

        directive('resizer', ['$rootScope', 'CurrentSession', function($rootScope, CurrentSession) {

            var link = function(scope, element, attrs) {

                var $window = $(window);
                var $resizer = $('#resizer');
                var resizerHalf = ($resizer.width() / 2);

                var ratio = 3/5; // updated on set size

                function setRightSize(size) {

                    var winWidth = window.innerWidth;

                    // make sure size is reasonable
                    if (winWidth - size < 60) return;
                    if (size < 300) return;

                    // update ratio
                    ratio = size / winWidth;

                    // update element
                    $resizer.css({
                        right: size - resizerHalf
                    });

                    // tell the world
                    $rootScope.$emit('split:resize', size);
                }

                function resizeToRatio() {
                    setRightSize(ratio * window.innerWidth);
                }

                /**
                 * Initialize
                 */

                resizeToRatio();

                /**
                 * Handle dragging
                 */

                // start drag
                $resizer.on('mousedown', function (e) {
                    // handle drag on any movement
                    $window.on('mousemove', dragHandler);
                    // release drag handler on next mouseup
                    $window.one('mouseup', function (e) {
                        $window.unbind('mousemove', dragHandler);
                    });
                });

                // during drag
                function dragHandler(e) {
                    e.preventDefault();
                    setRightSize(window.innerWidth - e.pageX);
                }

                /**
                 * Handle window resize
                 */

                $window.on('resize', function () {
                    resizeToRatio();
                });

            };

            return {
                restrict: 'E',
                replace: true,
                templateUrl: "js/angular/main/resizer/resizer.template.html",
                //controller: 'resizerController',
                scope: {},
                link: link
            }
        }]);

})();
