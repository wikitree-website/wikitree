(function() {
    angular.module('wikitree').

        factory('Search', ['$http', 'Articles', 'Categories', 'Searches',
            function($http, Articles, Categories, Searches) {
                var search = {};

                search.get_suggestions = function (term) {

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

                search.findOrAddArticle = function (title) {

                    // is this a category?
                    if (title.match(/^Category:/)) {
                        // skip to special handler
                        return search.findOrAddCategory(title);
                    }

                    return Articles.getByUnsafeTitle(title).
                        then(function (article) {
                            return{
                                type: 'article',
                                name: article.title,
                                title: article.title
                            };
                        }).
                        catch(function (err) {
                            console.log('In findOrAddArticle', err);
                            // no result? try searching
                            return search.findOrAddSearch(title);
                        });
                };

                search.findOrAddCategory = function (title) {
                    return Categories.getByUnsafeTitle(title).
                        then(function (category) {
                            return {
                                type: 'category',
                                name: category.title,
                                title: category.title
                            };
                        }).
                        catch(function (err) {
                            console.log('In findOrAddCategory', err);
                            // no result? try searching
                            return findOrAddSearch(title);
                        });
                };

                search.findOrAddSearch = function (query) {
                    return Searches.getByQuery(query).
                        then(function (search) {
                            return {
                                type: 'search',
                                name: 'Search "' + query + '"',
                                query: query
                            };
                        }).
                        catch(function (err) {
                            console.log('In findOrAddSearch', err);
                            // no dice
                            return null;
                        });
                };

                return search;
            }]);

})();
