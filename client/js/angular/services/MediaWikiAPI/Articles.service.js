(function() {
    angular.module('wikitree').

        factory('Articles', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {

            /**
             * Private
             */

            var byTitle = {};
            var byUnsafeTitle = {};

            function Article(args) {
                this.title = args.title;
                this.content = args.content;
                this.categories = args.categories;
            }

            //function getFromAPI(title) {
            //    console.log('Getting article from API...', title);
            //    var timestamp = Date.now();
            //    $rootScope.$broadcast('mediawikiapi:loadstart', timestamp);
            //
            //    return $http.jsonp('https://en.wikipedia.org/w/api.php', {
            //        params: {
            //            action: 'parse',
            //            prop: 'text|categorieshtml|displaytitle',
            //            redirects: 'true',
            //            page: title,
            //            format: 'json',
            //            callback: 'JSON_CALLBACK'
            //        }
            //
            //    }).then(function (data) {
            //        $rootScope.$broadcast('mediawikiapi:loadend', timestamp);
            //        if (data && data.parse && data.parse.title) {
            //            return data.parse;
            //        } else {
            //            throw "Article API error";
            //        }
            //
            //    }).catch(function (err) {
            //        console.error(err);
            //    });
            //
            //
            //}

            function getFromAPI(title) {

                console.log('Getting article from API...', title);

                var timestamp = Date.now();
                return $q(function (resolve, reject) {
                    $rootScope.$broadcast('mediawikiapi:loadstart', timestamp);
                    $http.jsonp('https://en.wikipedia.org/w/api.php', {
                        params: {
                            action: 'parse',
                            prop: 'text|categorieshtml|displaytitle',
                            redirects: 'true',
                            page: title,
                            format: 'json',
                            callback: 'JSON_CALLBACK'
                        }
                    }).
                        success(function (data) {
                            $rootScope.$broadcast('mediawikiapi:loadend', timestamp);
                            if (data && data.parse && data.parse.title) {
                                resolve(data.parse);
                            } else {
                                console.error('Article API error', arguments);
                                reject(null);
                            }
                        }).
                        error(function () {
                            $rootScope.$broadcast('mediawikiapi:loadend', timestamp);
                            console.error('Article API error', arguments);
                            reject(null);
                        });
                });
            }

            /**
             * Public
             */

            var Articles = {};

            Articles.getByTitle = function (title) {
                return $q(function (resolve, reject) {
                    if (byTitle[title]) {
                        resolve(byTitle[title]);
                    } else {
                        getFromAPI(title).
                            then(function (result) {
                                if (result) {
                                    var article = new Article({
                                        title: result.title,
                                        content: result.text['*'],
                                        categories: result.categorieshtml['*'],
                                        displaytitle: result.displaytitle
                                    });
                                    byTitle[article.title] = article;
                                    resolve(article);
                                } else {
                                    // sucks
                                    console.error('Article not found', title);
                                    reject(null);
                                }
                            }).
                            catch(function () {
                                // sucks
                                console.error('Article API error', title, arguments);
                                reject(null);
                            });
                    }
                });
            };

            // JUST for user input
            Articles.getByUnsafeTitle = function (unsafeTitle) {
                return $q(function (resolve, reject) {
                    if (byUnsafeTitle[unsafeTitle]) {
                        resolve(byUnsafeTitle[unsafeTitle]);
                    } else {
                        getFromAPI(unsafeTitle).
                            then(function (result) {
                                if (result) {
                                    var article = new Article({
                                        title: result.title,
                                        content: result.text['*'],
                                        categories: result.categorieshtml['*'],
                                        displaytitle: result.displaytitle
                                    });
                                    byUnsafeTitle[unsafeTitle] = article;
                                    byTitle[article.title] = article;
                                    resolve(article);
                                } else {
                                    // sucks
                                    console.error('Article not found!', unsafeTitle);
                                    reject(null);
                                }
                            }).
                            catch(function () {
                                // sucks
                                console.error('Article API error', unsafeTitle, arguments);
                                reject(null);
                            });
                    }
                });
            };

            return Articles;

        }]);

})();
