import json
from channels.generic.websocket import AsyncWebsocketConsumer


class TrendsyncConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "trendsync_updates"
        self.chat_rooms = set()

        # Get user info from query string if provided
        self.user_id = None
        self.user_role = None

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # If user is a seller, join their seller group for notifications
        query_string = self.scope.get("query_string", b"").decode()
        if "seller=true" in query_string:
            # Extract user_id from query string
            for param in query_string.split("&"):
                if param.startswith("user_id="):
                    self.user_id = param.split("=")[1]
                    self.user_role = "seller"
                    await self.channel_layer.group_add(
                        f"seller_{self.user_id}", self.channel_name
                    )
                    break

        await self.accept()

    async def disconnect(self, code):
        # Leave seller notification group if joined
        if self.user_id and self.user_role == "seller":
            await self.channel_layer.group_discard(
                f"seller_{self.user_id}", self.channel_name
            )

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
        user_id = data.get("user_id")
        role = data.get("role", "buyer")

        if room_id:
            self.chat_rooms.add(room_id)
            await self.channel_layer.group_add(room_id, self.channel_name)

            # If seller joins, also join their notification group
            if role == "seller" and user_id:
                await self.channel_layer.group_add(
                    f"seller_{user_id}", self.channel_name
                )

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
        sender_role = data.get("sender_role", "buyer")

        if room_id and content:
            # Send message to the chat room
            await self.channel_layer.group_send(
                room_id,
                {
                    "type": "chat_message",
                    "room_id": room_id,
                    "content": content,
                    "sender_id": sender_id,
                },
            )

            # If buyer sent message, notify the seller
            if sender_role == "buyer":
                # Extract IDs from room_id (format: chat_min_max)
                try:
                    parts = room_id.replace("chat_", "").split("_")
                    if len(parts) >= 2:
                        buyer_id = int(parts[0])
                        seller_id = int(parts[1])
                        # Notify the seller (the one who isn't the sender)
                        recipient_id = (
                            seller_id if str(sender_id) != str(seller_id) else buyer_id
                        )

                        await self.channel_layer.group_send(
                            f"seller_{recipient_id}",
                            {
                                "type": "new_chat_notification",
                                "room_id": room_id,
                                "content": content,
                                "sender_id": sender_id,
                            },
                        )
                except (ValueError, IndexError):
                    pass  # Invalid room format, skip notification

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

    async def new_chat_notification(self, event):
        """Handle incoming chat notification for sellers"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_chat_notification",
                    "room_id": event.get("room_id"),
                    "content": event.get("content"),
                    "sender_id": event.get("sender_id"),
                }
            )
        )

    async def websocket_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))
