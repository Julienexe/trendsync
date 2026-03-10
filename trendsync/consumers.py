import json
from channels.generic.websocket import AsyncWebsocketConsumer


class TrendsyncConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "trendsync_updates"
        self.chat_rooms = set()

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        for room in list(self.chat_rooms):
            await self.channel_layer.group_discard(room, self.channel_name)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            try:
                data = json.loads(text_data)
            except json.JSONDecodeError:
                data = {"text": text_data}

            message_type = data.get("type")

            if message_type == "join_room":
                await self.handle_join_room(data)
            elif message_type == "leave_room":
                await self.handle_leave_room(data)
            elif message_type == "chat_message":
                await self.handle_chat_message(data)
            else:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "websocket_message",
                        "data": data,
                    },
                )

    async def handle_join_room(self, data):
        room_id = data.get("room_id")
        if room_id:
            self.chat_rooms.add(room_id)
            await self.channel_layer.group_add(room_id, self.channel_name)
            await self.send(
                text_data=json.dumps({"type": "room_joined", "room_id": room_id})
            )

    async def handle_leave_room(self, data):
        room_id = data.get("room_id")
        if room_id and room_id in self.chat_rooms:
            self.chat_rooms.discard(room_id)
            await self.channel_layer.group_discard(room_id, self.channel_name)
            await self.send(
                text_data=json.dumps({"type": "room_left", "room_id": room_id})
            )

    async def handle_chat_message(self, data):
        room_id = data.get("room_id")
        content = data.get("content")
        sender_id = data.get("sender_id")

        if room_id and content:
            await self.channel_layer.group_send(
                room_id,
                {
                    "type": "chat_message",
                    "room_id": room_id,
                    "content": content,
                    "sender_id": sender_id,
                },
            )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "room_id": event.get("room_id"),
                    "content": event.get("content"),
                    "sender_id": event.get("sender_id"),
                }
            )
        )

    async def websocket_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))
