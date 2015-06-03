(function() {
    angular.module('wikitree.session.resizer').
        directive('resizer', [
            '$rootScope',
            'Resizer',
            function($rootScope, Resizer) {
                var link = function(scope, element, attrs) {

                    var $window = $(window);
                    var $resizer = $('#resizer');
                    var resizerWidth = $resizer.width();

                    function resizeToRatio() {
                        Resizer.size = Resizer.ratio * window.innerWidth;
                        setRightSize(Resizer.size);
                        restoreElement();
                    }

                    function setRightSize(size) {
                        var winWidth = window.innerWidth;
                        // make sure size is reasonable
                        if (winWidth - size < Resizer.MIN_REMAINDER) return;
                        if (size < Resizer.MIN_SIZE) return;
                        // update measurements
                        Resizer.size = size;
                        Resizer.ratio = size / winWidth;
                        // tell the world
                        $rootScope.$broadcast('split:resize');
                    }

                    function fillElement() {
                        $resizer.css({
                            width: '100%',
                            left: 0,
                            right: 0
                        });
                    }

                    function restoreElement() {
                        $resizer.css({
                            width: '', // reset
                            left: '', // reset
                            right: Resizer.size - resizerWidth + 5
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
                        scope.$apply(function () {
                            fillElement();
                        });
                        // handle drag on any movement
                        $window.on('mousemove', dragHandler);
                        // release drag handler on next mouseup
                        $window.one('mouseup', function (e) {
                            // put resizer back in place
                            scope.$apply(function () {
                                restoreElement();
                            });
                            // unbind drag event for now
                            $window.unbind('mousemove', dragHandler);
                        });
                    });

                    // during drag
                    function dragHandler(e) {
                        e.preventDefault();
                        scope.$apply(function () {
                            setRightSize(window.innerWidth - e.pageX);
                        });
                    }

                    /**
                     * Handle window resize
                     */

                    $window.on('resize', function () {
                        scope.$apply(function () {
                            resizeToRatio();
                        });
                    });

                };

                return {
                    restrict: 'E',
                    replace: true,
                    templateUrl: "/js/angular/session/resizer/resizer.template.html",
                    //controller: 'resizerController',
                    scope: {},
                    link: link
                }
            }
        ]
    );
})();
