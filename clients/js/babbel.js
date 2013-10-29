'use strict';

/* jshint -W098 */
var Babbel = (function() {

    var connection,
        events = [],
        doc,
        BabbelInstance;

    /**
     * Create a message
     */
    function createMessage(type, data) {
        return JSON.stringify({type: type, data: data});
    }

    /**
     * Parse message
     */
    function parseMessage(message) {
        var object = JSON.parse(message);

        if (object.type == 'I') {
            doc = object.data;
            console.log('Initial data received and parsed: ', doc);
        } else if (object.type == 'R' && object.data == 'OK') {
            console.log('Message was successfully sent and updated.');
        } else if (object.type == 'D') {
            callEvents(object.data);
        }
    }

    /**
     * Call events
     */
    function callEvents(data) {
        for (var i = 0; i < events.length; i++) {
            console.log('Sending data to event, should patch doc instead TODO');
            events[i](data);
        }
    }

    /**
     * Public API
     */
    BabbelInstance = function(uri) {
        connection = new WebSocket(uri);
        connection.onopen = function() {
            console.log('Connected.');
        };
        connection.onmessage = function(e) {
            console.log('Raw data received: ' + e.data);
            parseMessage(e.data);
        };
        connection.onclose = function() {
            console.log('Disconnected.');
        };
    };

    BabbelInstance.prototype.on = function(event, callback) {
        events.push(callback);
    };

    BabbelInstance.prototype.edit = function(callback) {
        function patchCallback(patches) {
            var message = createMessage('D', patches);

            if (connection.readyState == WebSocket.OPEN) {
                connection.send(message);
            }

            callEvents(message);
        }

        var observer = jsonpatch.observe(doc, patchCallback);
        callback(doc);
        jsonpatch.unobserve(doc, observer);
    };

    return BabbelInstance;

})();
