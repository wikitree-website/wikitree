(function() {
    angular.module('wikitree').
        factory('Sessions', [
            '$rootScope',
            '$location',
            'localStorageService',
            'Utilities',
            function($rootScope, $location, localStorageService, Utilities) {

                function Session (term) {
                    this.new = true;
                    this.start = term;
                    this.uuid = Utilities.makeUUID();
                    this.data = {
                        current_node_id:   undefined,
                        prev_stack:        [],
                        next_stack:        [],
                        nodes:             [],
                        links:             []
                    }
                }

                function SessionIndex (session, name) {
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

                Sessions.is_new = function () {
                    // any existing sessions?
                    if (Sessions.index.length !== 0) {
                        var active_session = Sessions.index[Sessions.active];

                        // pull up the active one
                        if (active_session) {
                            $location.path('/session/' + active_session.uuid);
                        }
                    }
                };

                Sessions.new = function (name) {
                    //debugger
                    Sessions.active = 0;

                    var session = new Session(name);
                    Sessions.index.unshift(new SessionIndex(session, name));

                    localStorageService.set(session.uuid, session);
                    localStorageService.set('index', Sessions.index);
                    localStorageService.set('active', Sessions.active);

                    console.log('new session', session.uuid);

                    $location.path('/session/'+session.uuid);
                    return session;
                };

                Sessions.save = function (uuid, data) {
                    var session = localStorageService.get(uuid);

                    session.new = false;
                    session.data = data;

                    Sessions.index[Sessions.active].date = Date.now();
                    localStorageService.set('index', Sessions.index);

                    localStorageService.set(uuid, session);
                };

                //Sessions.restore = function(idx) {
                //    Sessions.active = idx;
                //    localStorageService.set('active', Sessions.active);
                //    console.log('Sessions.restore', idx, Sessions.index[idx]);
                //
                //    var restoredSessionUUID = Sessions.index[idx].uuid;
                //    var restoredSession = localStorageService.get(restoredSessionUUID);
                //    localStorageService.set(uuid, session);
                //};

                Sessions.restore = function (uuid) {
                    var session = localStorageService.get(uuid);

                    console.log('restored session', session);

                    if (!session) $location.path('/');

                    // LOL
                    Sessions.active = Sessions.index.indexOf(Sessions.index.
                        filter(function (session) {
                            return session.uuid === uuid
                        })[0]);

                    console.log('active session', Sessions.active);

                    return session;
                };

                Sessions.delete = function (idx) {
                    var deletedSessionUUID = Sessions.index[idx].uuid;
                    localStorageService.remove(deletedSessionUUID);

                    Sessions.index.splice(idx, 1);
                    localStorageService.set('index', Sessions.index);

                    // if deleted only session:
                    if (Sessions.index.length == 0) {
                        window.location = '/welcome';
                    // if deleted active session that was last:
                    } else if (idx == Sessions.active) {
                        var uuid;
                        if (idx == Sessions.index.length) {
                            //Sessions.restore(idx - 1);          // won't work anymore
                            uuid = Sessions.index[idx-1].uuid;
                        } else {
                            //Sessions.restore(idx);              // won't work anymore
                            uuid = Sessions.index[idx].uuid;
                        }
                        $location.path('/session/'+uuid);
                    // if deleted session above active
                    } else if (idx < Sessions.active) {
                        Sessions.active--;
                    }
                };

                return Sessions;
        }]);

})();
