#!/usr/bin/env python
import uuid
import collections
import urllib.parse
import logging
import json

import asyncio
import websockets
import jsonpatch


#logging.basicConfig(level=logging.DEBUG)


Client = collections.namedtuple('Client', ['ident', 'socket', 'uri'])
URI = collections.namedtuple('URI', ['account', 'document', 'handler', 'paths'])

clients = set()
clients_uri = collections.defaultdict(list)

database = collections.defaultdict(dict)


def parse_uri(uri):
    parsed_uri = urllib.parse.urlparse(uri)
    paths = parsed_uri.path[1:].split('/')

    try:
        account = paths.pop(0)
        document = paths.pop(0)
        handler = '/{}/{}'.format(account, document)
    except IndexError:
        return URI(None, None, None, None)

    # TODO: only make paths a none list right now because this needs to be hashable
    return URI(account, document, handler, '/'.join(paths))

def parse_input(data):
    return json.loads(data)

@asyncio.coroutine
def hello(websocket, uri):
    parsed_uri = parse_uri(uri)

    client = Client(uuid.uuid4(), websocket, parsed_uri)
    clients.add(client)
    clients_uri[parsed_uri.handler].append(client)

    print('I {} Added client from URI {}'.format(client.ident, uri))

    try:
        # Send initial document from database
        if websocket.open:
            response = json.dumps({'type': 'I', 'data': database[parsed_uri.handler]})
            print("> {} {}".format(client.ident, response))
            websocket.send(response)

        while websocket.open:
            raw_data = yield from websocket.recv()
            if raw_data:
                # Parse and validate input
                data = parse_input(raw_data)

                # Update database
                patch = jsonpatch.JsonPatch(data['data'])
                database[parsed_uri.handler] = patch.apply(database[parsed_uri.handler])
                print('I {} Updated database new value {}'.format(client.ident, database[parsed_uri.handler]))

                # Return response
                print("< {} {}".format(client.ident, raw_data))
                response = json.dumps({'type': 'R', 'data': 'OK'})
                print("> {} {}".format(client.ident, response))
                websocket.send(response)

                # Notify other clients
                for other_client in clients_uri[client.uri.handler]:
                    if other_client != client:
                        other_client.socket.send(raw_data)
                        print("> {} {}".format(other_client.ident, raw_data))

    except websockets.exceptions.InvalidState as exc:
        print("E {} {}".format(client.ident, exc))

    print("I {} Removed client from URI {}".format(client.ident, uri))
    clients_uri[parsed_uri.handler].remove(client)
    clients.remove(client)

start_server = websockets.serve(hello, '0.0.0.0', 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
