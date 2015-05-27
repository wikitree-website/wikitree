(function() {
    angular.module('wikitree').

        factory('Searches', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {

            /**
             * Private
             */

            var byQuery = {};

            function Search(args) {
                this.query = args.query;
                this.suggestion = args.suggestion;
                this.totalhits = args.totalhits;
                this.results = args.results;
            }

            function getFromAPI(query) {

                console.log('Getting search results from API...', query);

                var timestamp = Date.now();
                return $q(function (resolve, reject) {
                    $rootScope.$broadcast('mediawikiapi:loadstart', timestamp);
                    $http.jsonp('https://en.wikipedia.org/w/api.php', {
                        params: {
                            action: 'query',
                            list: 'search',
                            srprop: 'titlesnippet|snippet|size|wordcount|timestamp',
                            srsearch: query,
                            srlimit: 50,
                            format: 'json',
                            callback: 'JSON_CALLBACK'
                        }
                    }).
                        success(function (data) {
                            $rootScope.$broadcast('mediawikiapi:loadend', timestamp);
                            if (data && data.query && data.query.searchinfo) {
                                resolve(data.query);
                            } else {
                                console.error('Search API error', arguments);
                                reject(null);
                            }
                        }).
                        error(function () {
                            $rootScope.$broadcast('mediawikiapi:loadend', timestamp);
                            console.error('Search API error', arguments);
                            reject(null);
                        });
                });
            }

            /**
             * Public
             */

            var Searches = {};

            Searches.getByQuery = function (query) {
                return $q(function (resolve, reject) {
                    if (byQuery[query]) {
                        resolve(byQuery[query]);
                    } else {
                        getFromAPI(query).
                            then(function (result) {
                                if (result) {
                                    var search = new Search({
                                        query: query,
                                        suggestion: {
                                            text: result.searchinfo.suggestion,
                                            html: result.searchinfo.suggestionsnippet
                                        },
                                        totalhits: result.totalhits,
                                        results: result.search
                                    });
                                    byQuery[search.query] = search;
                                    resolve(search);
                                } else {
                                    // sucks
                                    console.error('Search failed', query);
                                    reject(null);
                                }
                            }).
                            catch(function () {
                                // sucks
                                console.error('Search API error', query, arguments);
                                reject(null);
                            });
                    }
                });
            };

            return Searches;

        }]);

})();
