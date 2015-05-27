(function() {
    angular.module('wikitree.main.reader').
        controller('readerController', [
            '$rootScope',
            '$scope',
            'CurrentSession',
            'Sessions',
            'Articles',
            'Searches',
            'Categories',
            function($rootScope, $scope, CurrentSession, Sessions, Articles, Searches, Categories) {

                // for reader width
                $scope.readerWidth = '60%';

                // for frame node load
                $scope.currentNodeName = null;
                $scope.missedFrameUpdate = false;
                $scope.hasReferences = false;

                // for loading indicator
                $scope.loadingCount = 0;

                // for prev/next buttons
                $scope.hasBackward = CurrentSession.hasBackward();
                $scope.hasForward = CurrentSession.hasForward();

                // keep history buttons updated
                $rootScope.$on('update:currentnode', function () {
                    $scope.hasBackward = CurrentSession.hasBackward();
                    $scope.hasForward = CurrentSession.hasForward();
                });

                // keep loading indicator updated
                $rootScope.$on('mediawikiapi:loadstart', function () {
                    $scope.loadingCount++;
                });
                $rootScope.$on('mediawikiapi:loadend', function () {
                    $scope.loadingCount--;
                });

                // keep iframe content updated
                $rootScope.$on('update:currentnode', function () {
                    $scope.updateFrameNode();
                });

                // keep reader width updated
                $rootScope.$on('split:resize', function (e, data) {
                    $scope.readerWidth = data + 'px';
                });

                /**
                 * Reader controls
                 */

                $scope.historyBackward = function () {
                    CurrentSession.goBackward();
                };

                $scope.historyForward = function () {
                    CurrentSession.goForward();
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

                $scope.scrollToReferences = function () {
                    if (!$scope.frameWindow) return;
                    $scope.frameWindow.scrollToReferences();
                };

                /**
                 * Reader node content
                 */

                $scope.updateFrameNode = function () {

                    // make sure we got iframe
                    if (!$scope.frameWindow) {
                        $scope.missedFrameUpdate = true;
                        return;
                    }

                    // grab current node
                    var node = CurrentSession.getCurrentNode();

                    // make sure we got node
                    if (!node) {
                        $scope.currentNodeName = null;
                        $scope.frameWindow.loadError(
                            'System error: could not find a current node'
                        );
                        return;
                    }

                    // check if node already displayed
                    if ($scope.currentNodeName) {
                        if ($scope.currentNodeName === node.name) {
                            return;
                        }
                    }

                     // update current name
                    $scope.currentNodeName = node.name;

                    // save update
                    Sessions.save();

                    // on iframe node load
                    function onLoad() {
                        // update reference check
                        $scope.hasReferences = $scope.frameWindow.checkForReferences();
                    }

                    // load node into iframe
                    switch (node.type) {
                        case 'category': loadCategory(node, onLoad); break;
                        case 'article': loadArticle(node, onLoad); break;
                        case 'search': loadSearch(node, onLoad); break;
                    }

                };

                function loadCategory(node, callback) {
                    Categories.getByTitle(node.title).
                        then(function (category) {
                            $scope.frameWindow.loadCategory(
                                category,
                                makeTitleCallback(node)
                            );
                            if (callback) callback(category);
                        }).
                        catch(function () {
                            $scope.frameWindow.loadError(
                                'System error: unable to load "' + node.title + '"'
                            );
                        });
                }

                function loadArticle(node, callback) {
                    Articles.getByTitle(node.title).
                        then(function (article) {
                            $scope.frameWindow.loadArticle(
                                article,
                                makeTitleCallback(node)
                            );
                            if (callback) callback(article);
                        }).
                        catch(function () {
                            $scope.frameWindow.loadError(
                                'System error: unable to load article "' + node.title + '"'
                            );
                        });
                }

                function loadSearch(node, callback) {
                    Searches.getByQuery(node.query).
                        then(function (search) {
                            $scope.frameWindow.loadSearch(
                                search,
                                makeTitleCallback(node)
                            );
                            if (callback) callback(search);
                        }).
                        catch(function () {
                            $scope.frameWindow.loadError(
                                'System error: unable to load search "' + node.query + '"'
                            );
                        });
                }

                function makeTitleCallback(node) {
                    return function (title, noSetCurrent, isSearch) {
                        // user clicked an iframe title!
                        title = decodeURIComponent(title);
                        if (isSearch) {
                            // skip to search
                            CurrentSession.handleTitleSearch({
                                title: title,
                                noSetCurrent: noSetCurrent,
                                sourceNodeId: node.uuid
                            });
                        } else {
                            // handle title
                            CurrentSession.handleTitle({
                                title: title,
                                noSetCurrent: noSetCurrent,
                                sourceNodeId: node.uuid
                            });
                        }
                    };
                }

                /**
                 * Load article if there is one
                 */

                if (CurrentSession.getCurrentNode()) {
                    $scope.updateFrameNode();
                }

            }
        ]);
})();
