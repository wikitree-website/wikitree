(function() {
    angular.module('wikitree').

        factory('Categories', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {

            /**
             * Private
             */

            var byTitle = {};
            var byUnsafeTitle = {};

            function Category(args) {
                this.name = args.name;
                this.title = args.title;
                this.content = args.content;
                this.categories = args.categories;
                this.displaytitle = args.displaytitle;
                this.subcategories = args.subcategories;
                this.memberpages = args.memberpages;
            }

            function getFromAPI(title) {

                console.log('Getting category from API...', title);

                var timestamp = Date.now();
                return $q(function (resolve, reject) {
                    // fetch parsed content
                    var getPageContent = $http.jsonp('https://en.wikipedia.org/w/api.php', {
                        params: {
                            action: 'parse',
                            prop: 'text|categorieshtml|displaytitle',
                            redirects: 'true',
                            page: title,
                            format: 'json',
                            callback: 'JSON_CALLBACK'
                        }
                    });
                    // fetch subcategories
                    var getSubcategories = $http.jsonp('https://en.wikipedia.org/w/api.php', {
                        params: {
                            action: 'query',
                            list: 'categorymembers',
                            cmtype: 'subcat',
                            cmtitle: title,
                            cmlimit: 500,
                            format: 'json',
                            callback: 'JSON_CALLBACK'
                        }
                    });
                    // fetch member pages
                    var getMemberpages = $http.jsonp('https://en.wikipedia.org/w/api.php', {
                        params: {
                            action: 'query',
                            list: 'categorymembers',
                            cmtype: 'page',
                            cmtitle: title,
                            cmlimit: 500,
                            format: 'json',
                            callback: 'JSON_CALLBACK'
                        }
                    });
                    // wait for all calls to complete
                    $q.all([getPageContent, getSubcategories, getMemberpages]).
                        then(function (values) {
                            $rootScope.$broadcast('mediawikiapi:loadend', timestamp);

                            var page = values[0];
                            var subcategories = values[1];
                            var memberpages = values[2];

                            var result = {};

                            if (page &&
                                page.data &&
                                page.data.parse &&
                                page.data.parse.title) {
                                result.title = page.data.parse.title;
                                result.content = page.data.parse.text['*'];
                                result.categories = page.data.parse.categorieshtml['*'];
                                result.displaytitle = page.data.parse.displaytitle;
                            }

                            if (subcategories &&
                                subcategories.data &&
                                subcategories.data.query &&
                                subcategories.data.query.categorymembers &&
                                subcategories.data.query.categorymembers.length) {
                                result.subcategories = subcategories.data.query.categorymembers;
                            }

                            if (memberpages &&
                                memberpages.data &&
                                memberpages.data.query &&
                                memberpages.data.query.categorymembers &&
                                memberpages.data.query.categorymembers.length) {
                                result.memberpages = memberpages.data.query.categorymembers;
                            }

                            if (result.title) {
                                result.name = result.title.slice('Category:'.length);
                                resolve(result);
                            } else {
                                console.error('Category API error', arguments);
                                reject(null);
                            }

                        }).
                        catch(function () {
                            $rootScope.$broadcast('mediawikiapi:loadend', timestamp);
                            console.error('Category API error', arguments);
                            reject(null);
                        });
                });
            }

            /**
             * Public
             */

            var Categories = {};

            Categories.getByTitle = function (title) {
                return $q(function (resolve, reject) {
                    if (byTitle[title]) {
                        resolve(byTitle[title]);
                    } else {
                        getFromAPI(title).
                            then(function (result) {
                                if (result) {
                                    var category = new Category({
                                        name: result.name,
                                        title: result.title,
                                        content: result.content,
                                        categories: result.categories,
                                        displaytitle: result.displaytitle,
                                        subcategories: result.subcategories,
                                        memberpages: result.memberpages
                                    });
                                    byTitle[category.title] = category;
                                    resolve(category);
                                } else {
                                    // sucks
                                    console.error('Category not found', title);
                                    reject(null);
                                }
                            }).
                            catch(function () {
                                // sucks
                                console.error('Category API error', title, arguments);
                                reject(null);
                            });
                    }
                });
            };

            // JUST for user input
            Categories.getByUnsafeTitle = function (unsafeTitle) {
                return $q(function (resolve, reject) {
                    if (byUnsafeTitle[unsafeTitle]) {
                        resolve(byUnsafeTitle[unsafeTitle]);
                    } else {
                        getFromAPI(unsafeTitle).
                            then(function (result) {
                                if (result) {
                                    var category = new Category({
                                        name: result.name,
                                        title: result.title,
                                        content: result.content,
                                        categories: result.categories,
                                        displaytitle: result.displaytitle,
                                        subcategories: result.subcategories,
                                        memberpages: result.memberpages
                                    });
                                    byUnsafeTitle[unsafeTitle] = category;
                                    byTitle[category.title] = category;
                                    resolve(category);
                                } else {
                                    // sucks
                                    console.error('Category not found!', unsafeTitle);
                                    reject(null);
                                }
                            }).
                            catch(function () {
                                // sucks
                                console.error('Category API error', unsafeTitle, arguments);
                                reject(null);
                            });
                    }
                });
            };

            return Categories;

        }]);

})();
