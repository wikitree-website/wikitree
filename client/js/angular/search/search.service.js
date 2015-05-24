(function() {
    angular.module('wikitree.search').

        factory('Search', ['$http', function($http) {
            var search = {};

            search.term = '';

            search.getSuggestions = function (term) {

                console.log('Fetching suggestions...', term);

                return $http.jsonp('https://en.wikipedia.org/w/api.php', {
                    params: {
                        action: 'opensearch',
                        search: term,
                        callback: 'JSON_CALLBACK'
                    }
                }).then(function(response) {
                    return response.data[1];
                });
            };

            return search;
        }]);

})();
