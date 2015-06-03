(function() {
    angular.module('wikitree.session.reader').
        directive('reader', [function() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "/js/angular/session/reader/reader.template.html",
                controller: 'readerController',
                link: function(scope, element, attrs) {
                    // grab reference to iFrame's window object
                    // (gives us access to its global JS scope)
                    scope.frameWindow = null;
                    // be wary of race conditions...
                    element.find('iframe').
                        // ...add iframe load event
                        on('load', function () {
                            scope.frameWindow = this.contentWindow;
                            // check if frame called before existence
                            if (scope.missedFrameUpdate) {
                                scope.updateFrameNode();
                            }
                        }).
                        // ...THEN give it src url
                        attr('src', '/article-frame.html');
                }
            };
        }]);
})();
