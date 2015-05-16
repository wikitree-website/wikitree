(function() {
    angular.module('wikitree.main.reader').
        controller('readerController', ['$rootScope', '$scope', 'CurrentSession',
            function($rootScope, $scope, CurrentSession) {

            	$scope.scrollToReferences = function () {
                    $rootScope.$emit('request:reader:scroll_to_references');
                };

            }]);
})();
