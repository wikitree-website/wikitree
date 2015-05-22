(function() {
    angular.module('wikitree.main.reader').
        controller('readerController', ['$rootScope', '$scope', 'CurrentSession',
            function($rootScope, $scope, CurrentSession) {

            	$scope.scrollToReferences = function () {
                    $rootScope.$emit('request:reader:scroll_to_references');
                };

                $scope.openSourceArticle = function () {

                	console.log('hello');

                    var node = CurrentSession.getCurrentNode();
                    if (!(node && node.title)) return;
                    var url = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(node.title);
                    var link = document.createElement('a');
					link.target = '_blank';
					link.href = url;
					link.click();
                };

            }]);
})();
