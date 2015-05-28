(function() {
    angular.module('wikitree').

        factory('Utilities', [function() {

            var Utilities = {};

            Utilities.makeUUID = function() {
                // http://stackoverflow.com/a/2117523
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
            };

            Utilities.makeJitter = function (factor) {
                var jitter = factor * Math.random();
                if (Math.random() < 0.5) jitter = -1 * jitter;
                return jitter;
            };

            Utilities.shuffleArr = function (arr) {
                // copy array
                arr = arr.slice(0);

                //
                // Fisher Yates implementation by mbostock http://bost.ocks.org/mike/shuffle/

                var remaining = arr.length;
                var element;
                var index;

                // While there remain elements to shuffle…
                while (remaining) {

                    // Pick a remaining element…
                    index = Math.floor(Math.random() * remaining--);

                    // And swap it with the current element.
                    element = arr[remaining];
                    arr[remaining] = arr[index];
                    arr[index] = element;
                }

                return arr;
            };

            return Utilities;

        }]);

})();
