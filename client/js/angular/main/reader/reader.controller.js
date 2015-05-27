(function() {
    angular.module('wikitree.main.reader').
        controller('readerController', [
            '$rootScope',
            '$scope',
            'CurrentSession',
            function($rootScope, $scope, CurrentSession) {

            	$scope.scrollToReferences = function () {
                    $rootScope.$emit('request:reader:scroll_to_references');
                };

                $scope.openSourceArticle = function () {
                    var node = CurrentSession.getCurrentNode();
                    if (!(node && node.name)) return;
                    var url = '';
                    switch (node.type) {
                        case 'article':
                            url = 'https://en.wikipedia.org/wiki/';
                            url += encodeURIComponent(node.title);
                            break;
                        case 'search':
                            url = 'http://en.wikipedia.org/w/index.php?fulltext=1&search=';
                            url += encodeURIComponent(node.query);
                            break;
                    }
                    var link = document.createElement('a');
					link.target = '_blank';
					link.href = url;
					link.click();
                };

            }
        ]);
})();
