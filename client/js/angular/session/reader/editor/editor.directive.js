(function() {
    angular.module('wikitree.session.reader.editor').
        directive('editor', [function() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: "/js/angular/session/reader/editor/editor.template.html",
                controller: 'editorController',
                link: function(scope, element, attrs) {

                    // mmmm jquery soup

                    var $article = $('#reader .article');
                    var $editor = element;

                    $editor.hide();

                    scope.revealEditorEl = function () {
                        $article.animate({ 'bottom': '210px' }, 300);
                        $editor.show().animate({ 'height': '200px' }, 300);
                    };

                    scope.concealEditorEl = function (callback) {
                        $article.animate({ 'bottom': '0px' }, 150);
                        $editor.animate({ 'height': '0px' }, 150, function () {
                            $editor.hide();
                            if (callback) {
                                callback();
                            }
                        });
                    };

                }
            };
        }]);
})();
