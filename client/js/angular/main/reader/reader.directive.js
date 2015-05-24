(function() {
    angular.module('wikitree.main.reader').

        directive('reader', ['$rootScope', 'CurrentSession', 'Sessions', 'Articles', 'Searches',
            function($rootScope, CurrentSession, Sessions, Articles, Searches) {

                var link = function(scope, element, attrs) {

                    var $reader = $('#reader');


                    /**
                     * Node history
                     */

                    // history buttons
                    var $prevBtn = $reader.find('#history-prev');
                    var $nextBtn = $reader.find('#history-next');

                    // set initial states
                    if (!CurrentSession.hasBackward()) {
                        $prevBtn.attr('disabled', 'disabled');
                    }
                    if (!CurrentSession.hasForward()) {
                        $nextBtn.attr('disabled', 'disabled');
                    }

                    // listen for clicks
                    $prevBtn.on('click', function (e) {
                        e.preventDefault();
                        CurrentSession.goBackward();
                    });
                    $nextBtn.on('click', function (e) {
                        e.preventDefault();
                        CurrentSession.goForward();
                    });

                    // listen for arrow keys
                    $(window).on('keyup', function (e) {
                        switch (e.which) {
                            case 37:
                                // left arrow
                                CurrentSession.goBackward();
                                break;
                            case 39:
                                // right arrow
                                CurrentSession.goForward();
                                break;
                        }
                    });

                    // keep button states updated
                    CurrentSession.addListener('update:currentnode', function () {
                        if (!CurrentSession.hasBackward()) {
                            $prevBtn.attr('disabled', 'disabled');
                        } else {
                            $prevBtn.removeAttr('disabled');
                        }
                        if (!CurrentSession.hasForward()) {
                            $nextBtn.attr('disabled', 'disabled');
                        } else {
                            $nextBtn.removeAttr('disabled');
                        }
                    });


                    /**
                     * Reader resizing
                     */

                    $rootScope.$on('split:resize', function (e, data) {
                        $reader.css({ width: data });
                    });


                    /**
                     * Article loading indicator
                     */

                    var $logo = $reader.find('.w');
                    var $spinner = $reader.find('.spinner');
                    var loadingCount = 0;
                    $rootScope.$on('mediawikiapi:loadstart', function () {
                        loadingCount++;
                        $logo.css({ 'display': 'none' });
                        $spinner.css({ 'visibility': 'visible' });
                    });
                    $rootScope.$on('mediawikiapi:loadend', function () {
                        loadingCount--;
                        if (loadingCount < 1) {
                            $logo.css({ 'display': 'inline' });
                            $spinner.css({ 'visibility': 'hidden' });
                        }
                    });


                    /**
                     * iFrame & current article
                     */

                    var iframe = null;
                    var $iframe = $('#article-frame');
                    var missedOpportunity = false;
                    // listen for iframe load
                    $iframe.on('load', function () {
                        iframe = $iframe[0].contentWindow;
                        if (missedOpportunity) {
                            updateCurrentNode();
                        }
                    });
                    // THEN give iframe its src url
                    $iframe.attr('src', '/article-frame.html');

                    // handle "scroll to references" button
                    $rootScope.$on('request:reader:scroll_to_references', function () {
                        if (!iframe && iframe.scrollToReferences) return;
                        iframe.scrollToReferences();
                    });

                    // handle article loading
                    var currentNodeName = null;
                    CurrentSession.addListener('update:currentnode', updateCurrentNode);
                    function updateCurrentNode() {

                        // make sure we got iframe
                        if (!iframe) {
                            missedOpportunity = true;
                            return;
                        }

                        // grab current node
                        var node = CurrentSession.getCurrentNode();

                        // make sure we got node
                        if (!node) {
                            currentNodeName = null;
                            iframe.loadError('System error: could not find a current node');
                            return;
                        }

                        // check if node already displayed
                        if (currentNodeName) {
                            if (currentNodeName === node.name) {
                                return;
                            }
                        }

                         // update current name
                        currentNodeName = node.name;

                        // save update
                        Sessions.save();

                        // load node into iframe
                        switch (node.type) {
                            case 'article': loadArticle(node); break;
                            case 'search': loadSearch(node); break;
                        }

                    }

                    function loadArticle(node) {
                        Articles.getByTitle(node.title).
                            then(function (article) {
                                iframe.loadArticle(article, makeTitleCallback(node));
                            }).
                            catch(function () {
                                iframe.loadError('System error: unable to load article "' + node.title + '"');
                            });
                    }

                    function loadSearch(node) {
                        Searches.getByQuery(node.query).
                            then(function (search) {
                                iframe.loadSearch(search, makeTitleCallback(node));
                            }).
                            catch(function () {
                                iframe.loadError('System error: unable to load article "' + node.title + '"');
                            });
                    }

                    function makeTitleCallback(node) {
                        return function (title, noSetCurrent) {
                            // user clicked an iframe title!
                            title = decodeURIComponent(title);
                            CurrentSession.handleTitle({
                                title: title,
                                noSetCurrent: noSetCurrent,
                                sourceNodeId: node.uuid
                            });
                        };
                    }

                    /**
                     * Load article if there is one
                     */

                    if (CurrentSession.getCurrentNode()) {
                        updateCurrentNode();
                    }

                };

                return {
                    restrict: 'E',
                    replace: true,
                    templateUrl: "js/angular/main/reader/reader.template.html",
                    controller: 'readerController',
                    scope: {},
                    link: link
                }
        }]);

})();
