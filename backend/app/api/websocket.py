import json
import asyncio
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime

from app.core.inference import classifier
from app.core.config import settings

ws_router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        for ws in list(self.active):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(ws)


manager = ConnectionManager()


@ws_router.websocket("/stream/{machine_id}")
async def stream_endpoint(websocket: WebSocket, machine_id: str):
    """
    Real-time WebSocket endpoint.

    Client sends: {"signal": [float x 1024]}
    Server sends: prediction result JSON
    """
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            payload = json.loads(raw)

            if payload.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            signal = payload.get("signal")
            if not signal or len(signal) != settings.WINDOW_SIZE:
                await websocket.send_json({
                    "type" : "error",
                    "data" : {"message": f"signal must be {settings.WINDOW_SIZE} samples"},
                })
                continue

            result = classifier.predict(signal)
            await websocket.send_json({
                "type"      : "prediction",
                "data"      : {
                    **result,
                    "machine_id": machine_id,
                    "timestamp" : datetime.utcnow().isoformat(),
                },
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        await websocket.send_json({"type": "error", "data": {"message": str(e)}})
        manager.disconnect(websocket)


@ws_router.websocket("/demo/{machine_id}")
async def demo_stream(websocket: WebSocket, machine_id: str):
    """
    Demo endpoint — server pushes simulated vibration predictions every second.
    No client signal needed. Useful for frontend testing without real sensors.
    """
    await manager.connect(websocket)
    fault_cycle = [0, 0, 1, 0, 2, 0, 0, 3, 0, 1]  # simulate occasional faults
    idx = 0
    try:
        while True:
            fault_id = fault_cycle[idx % len(fault_cycle)]
            # Simulate a window with some noise
            signal = np.random.randn(settings.WINDOW_SIZE).tolist()
            result = classifier.predict(signal)
            # Override for demo variety
            result["fault_id"]    = fault_id
            result["fault_class"] = settings.CLASS_NAMES[fault_id]
            result["is_fault"]    = fault_id != 0

            await websocket.send_json({
                "type": "prediction",
                "data": {
                    **result,
                    "machine_id": machine_id,
                    "timestamp" : datetime.utcnow().isoformat(),
                    "demo"      : True,
                },
            })
            idx += 1
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
