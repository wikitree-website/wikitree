(function() {
    angular.module('wikitree').
        factory('Sessions', [
            '$rootScope',
            '$location',
            'localStorageService',
            'Utilities',
            'CurrentSession',
            function($rootScope, $location, localStorageService, Utilities, CurrentSession) {

                function Session() {
                    this.uuid = Utilities.makeUUID();
                    this.data = {
                        history: {},
                        nodes: {},
                        links: {}
                    }
                }

                function SessionIndex(session, name) {
                    this.uuid = session.uuid;
                    this.name = name;
                    this.rename = name;
                    this.date = Date.now();
                }

                var Sessions = {};

                Sessions.index  = localStorageService.get('index')  || [];
                Sessions.active = localStorageService.get('active') || 0;

                // a sort happened!  gotta know where your active session is...
                // fired in menu.controller.js
                $rootScope.$on('session:sort', function (event, data) {
                    //  moved the active session
                    console.log('Sorted sessions', data);
                    if (data.start == Sessions.active) {
                        console.log('Moved active session, updating...');
                        Sessions.active = data.stop;
                    // moved a session below active above
                    } else if (data.start > Sessions.active && data.stop <= Sessions.active) {
                        console.log('Moved a session over active, updating...');
                        Sessions.active++;
                    // moved a session above active below
                    } else if (data.start < Sessions.active && data.stop >= Sessions.active) {
                        console.log('Moved a session under active, updating...');
                        Sessions.active--;
                    }
                });

                Sessions.new = function(name) {
                    Sessions.active = 0;

                    var newSession = new Session();
                    Sessions.index.unshift(new SessionIndex(newSession, name));

                    localStorageService.set(newSession.uuid, newSession);
                    localStorageService.set('index', Sessions.index);
                    localStorageService.set('active', Sessions.active);

                    CurrentSession.clearState();
                };

                Sessions.save = function() {
                    var currentSessionUUID = Sessions.index[Sessions.active].uuid;
                    var currentSession = localStorageService.get(currentSessionUUID);

                    currentSession.data = CurrentSession.exportState();
                    localStorageService.set(currentSessionUUID, currentSession);

                    Sessions.index[Sessions.active].date = Date.now();
                    localStorageService.set('index', Sessions.index);
                    localStorageService.set('active', Sessions.active);
                };

                Sessions.restore = function(idx) {
                    Sessions.active = idx;
                    localStorageService.set('active', Sessions.active);
                    console.log('clicked', idx, Sessions.index[idx]);

                    var restoredSessionUUID = Sessions.index[idx].uuid;
                    var restoredSession = localStorageService.get(restoredSessionUUID);

                    CurrentSession.clearState();
                    CurrentSession.importState(restoredSession);
                };

                Sessions.delete = function(idx) {
                    var deletedSessionUUID = Sessions.index[idx].uuid;
                    localStorageService.remove(deletedSessionUUID);

                    Sessions.index.splice(idx, 1);
                    localStorageService.set('index', Sessions.index);

                    // if deleted only session:
                    if (Sessions.index.length == 0) {
                        window.location = '/';
                    // if deleted active session that was last:
                    } else if (idx == Sessions.active) {
                        if (idx == Sessions.index.length) {
                            Sessions.restore(idx - 1);
                        } else {
                            Sessions.restore(idx);
                        }
                    // if deleted session above active
                    } else if (idx < Sessions.active) {
                        Sessions.active--;
                    }
                };

                /**
                 * Save events
                 */

                $(window).on('beforeunload', function () {
                    Sessions.save();
                });

                $rootScope.$on('update:nodes+links', function () {
                    Sessions.save();
                });

                return Sessions;
        }]);

})();
