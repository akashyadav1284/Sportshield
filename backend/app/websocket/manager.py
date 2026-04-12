"""SportShield AI — Socket.IO WebSocket manager for real-time events."""

import socketio
from typing import Optional

from app.core.config import settings
from app.core.security import decode_token

# Create Socket.IO async server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.cors_origins_list,
    logger=False,
    engineio_logger=False,
)

# ASGI app to be mounted on FastAPI
socket_app = socketio.ASGIApp(sio)


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection with JWT authentication via HTTP-only cookies."""
    token = None
    
    # Check headers directly in ASGI scope
    headers = environ.get("asgi.scope", {}).get("headers", [])
    for key, value in headers:
        if key == b"cookie":
            cookies = value.decode("utf-8").split("; ")
            for cookie in cookies:
                if cookie.startswith("access_token="):
                    token = cookie.split("=")[1]
                    break

    if not token:
        # Fallback to HTTP_COOKIE key
        cookie_header = environ.get("HTTP_COOKIE", "")
        for cookie in cookie_header.split("; "):
            if cookie.startswith("access_token="):
                token = cookie.split("=")[1]
                break

    if not token:
        raise socketio.exceptions.ConnectionRefusedError("Authentication required")

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        org_id = payload.get("org_id")

        if not user_id or not org_id:
            raise socketio.exceptions.ConnectionRefusedError("Invalid token")

        # Store user info in session
        await sio.save_session(sid, {
            "user_id": user_id,
            "org_id": org_id,
        })

        # Join organization room
        room = f"org_{org_id}"
        sio.enter_room(sid, room)
        print(f"Client {sid} connected to room {room}")

    except Exception as e:
        print(f"WebSocket auth error: {e}")
        raise socketio.exceptions.ConnectionRefusedError("Authentication failed")


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    session = await sio.get_session(sid)
    if session:
        org_id = session.get("org_id")
        if org_id:
            sio.leave_room(sid, f"org_{org_id}")
    print(f"Client {sid} disconnected")


def emit_event(org_id: str, event: str, data: dict):
    """Emit an event to all clients in an organization's room.

    This function is designed to be called from synchronous Celery tasks.
    It creates a background task to emit the event asynchronously.

    Args:
        org_id: Organization UUID string.
        event: Event name (e.g., 'new_violation', 'scan_completed').
        data: Event payload dict.
    """
    import asyncio

    room = f"org_{org_id}"

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(sio.emit(event, data, room=room))
        else:
            loop.run_until_complete(sio.emit(event, data, room=room))
    except RuntimeError:
        # No event loop available (common in Celery), create new one
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(sio.emit(event, data, room=room))
        finally:
            loop.close()
