(function() {
    angular.module('wikitree.session.reader.editor').
        controller('editorController', [
            '$rootScope',
            '$scope',
            function($rootScope, $scope) {

                $scope.noteNode = null;
                $scope.editorName = '';
                $scope.editorBody = '';

                $scope.$on('update:current-note-node', function () {
                    var node = $scope.session.getCurrentNoteNode();
                    if (node && node.uuid) {
                        $scope.openEditor(node);
                    } else {
                        close();
                    }
                });

                $scope.tryEnter = function ($event) {
                    if ($event.keyCode === 13) {
                        $event.preventDefault();
                        $scope.saveNote();
                    }
                };

                $scope.openEditor = function (node) {
                    safeAction(function () {
                        open(node);
                    });
                };

                $scope.closeEditor = function () {
                    safeAction(function () {
                        $scope.session.setCurrentNoteNodeId(null);
                    });
                };

                $scope.saveNote = function () {
                    $scope.session.updateNoteNodeContent(
                        $scope.noteNode.uuid,
                        $scope.editorName,
                        $scope.editorBody
                    );
                };

                $scope.centerNode = function () {
                    $rootScope.$broadcast(
                        'request:graph:locate_node',
                        $scope.noteNode
                    );
                };

                function safeAction(action) {
                    if (hasChanges()) {
                        if (window.confirm('Your current note has unsaved changes, are you sure you want to continue?')) {
                            action();
                        }
                    } else {
                        action();
                    }
                }

                function hasChanges() {
                    if (!$scope.noteNode) return false;
                    if ($scope.noteNode.name != $scope.editorName ||
                        $scope.noteNode.body != $scope.editorBody) {
                        return true;
                    }
                }

                function open(node) {
                    $scope.noteNode = node;
                    $scope.editorName = $scope.noteNode.name;
                    $scope.editorBody = $scope.noteNode.body;
                    $scope.revealEditorEl();
                }

                function close() {
                    $scope.concealEditorEl(function () {
                        // clean out editor after animation
                        $scope.noteNode = null;
                        $scope.editorName = '';
                        $scope.editorBody = '';
                    });
                }

            }
        ]);
})();
