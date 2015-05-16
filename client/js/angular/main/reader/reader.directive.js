(function() {
    angular.module('wikitree.main.reader').

        directive('reader', ['$rootScope', 'CurrentSession', 'Sessions', 'Search', 'Articles',
            function($rootScope, CurrentSession, Sessions, Search, Articles) {

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
                    var articleLoadingCount = 0;
                    $rootScope.$on('articles:loadstart', function (e, data) {
                        articleLoadingCount++;
                        $logo.css({ 'display': 'none' });
                        $spinner.css({ 'visibility': 'visible' });
                    });
                    $rootScope.$on('articles:loadend', function (e, data) {
                        articleLoadingCount--;
                        if (articleLoadingCount < 1) {
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
                            updateCurrentArticle();
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
                    var currentTitle = null;
                    CurrentSession.addListener('update:currentnode', updateCurrentArticle);
                    function updateCurrentArticle() {

                        // make sure we got iframe
                        if (!iframe) {
                            missedOpportunity = true;
                            return;
                        }

                        // grab current node
                        var node = CurrentSession.getCurrentNode();

                        // make sure we got node
                        if (!node) {
                            currentTitle = null;
                            iframe.loadArticle(
                                '',
                                'System error: could not find a current node'
                            );
                            return;
                        }

                        // check if node article already displayed
                        if (currentTitle) {
                            if (currentTitle === node.title) {
                                return;
                            }
                        }

                         // update current title
                        currentTitle = node.title;

                        // save update
                        Sessions.save();

                        // load node into iframe
                        Articles.getByTitle(node.title).
                            then(function (article) {
                                iframe.loadArticle(
                                    article.title,
                                    article.content,
                                    article.categories,
                                    function (title, noSetCurrent) {
                                        // user clicked a title!
                                        title = decodeURI(title);
                                        CurrentSession.handleTitle({
                                            title: title,
                                            noSetCurrent: noSetCurrent,
                                            sourceNodeId: node.uuid
                                        });
                                    }
                                );
                            }).
                            catch(function () {
                                iframe.loadArticle(
                                    '',
                                    'System error: unable to load article "' + node.title + '"'
                                );

                            });
                    }

                    if (CurrentSession.getCurrentNode()) {
                        updateCurrentArticle();
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
