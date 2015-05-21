(function() {
    angular.module('wikitree.main.resizer').

        directive('resizer', ['$rootScope', 'CurrentSession', function($rootScope, CurrentSession) {

            var link = function(scope, element, attrs) {

                var $window = $(window);
                var $resizer = $('#resizer');
                var resizerHalf = ($resizer.width() / 2);

                var ratio = 3/5; // updated on set size

                function resizeToRatio() {
                    setRightSize(ratio * window.innerWidth);
                    restoreElement();
                }

                function setRightSize(size) {
                    var winWidth = window.innerWidth;
                    // make sure size is reasonable
                    if (winWidth - size < 60) return;
                    if (size < 300) return;
                    // update ratio
                    ratio = size / winWidth;
                    // tell the world
                    $rootScope.$emit('split:resize', size);
                }

                function fillElement() {
                    $resizer.css({
                        width: '100%',
                        left: 0,
                        right: 0
                    });
                }

                function restoreElement() {
                    var size = ratio * window.innerWidth;
                    $resizer.css({
                        width: '', // reset
                        left: '', // reset
                        right: size - resizerHalf
                    });
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
                    // fill screen to prevent iframe steal
                    fillElement();
                    // handle drag on any movement
                    $window.on('mousemove', dragHandler);
                    // release drag handler on next mouseup
                    $window.one('mouseup', function (e) {
                        // put resizer back in place
                        restoreElement();
                        // unbind drag event for now
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
