import asyncio
import datetime
import json
import random
from typing import Dict, List, Set
from backend.database import get_db, log_audit

class TelemetrySimulator:
    def __init__(self):
        self.subscribers: Set[asyncio.Queue] = set()
        self.running = False
        self._task = None

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self.subscribers.discard(q)

    async def broadcast(self, data: Dict):
        for q in list(self.subscribers):
            try:
                await q.put(data)
            except Exception:
                self.subscribers.discard(q)

    async def start(self):
        if not self.running:
            self.running = True
            self._task = asyncio.create_task(self._simulation_loop())

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()

    async def _simulation_loop(self):
        while self.running:
            try:
                await asyncio.sleep(6) # send telemetry packet every 6s
                await self._generate_step()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Simulator Error] {e}")

    async def _generate_step(self):
        conn = get_db()
        cursor = conn.cursor()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Query all sensors
        cursor.execute("SELECT id, hardware_uid, metrics_json, zone_id, is_simulated FROM devices WHERE type = 'SENSOR' AND status = 'ONLINE'")
        sensors = cursor.fetchall()

        for s in sensors:
            device_id = s["id"]
            zone_id = s["zone_id"]
            metrics = json.loads(s["metrics_json"])

            for m in metrics:
                val = 0.0
                if m == "TEMP":
                    val = round(21.0 + random.uniform(-1.5, 2.5), 1)
                elif m == "HUMI":
                    val = round(70.0 + random.uniform(-3.0, 4.0), 1)
                elif m == "SOIL":
                    val = round(55.0 + random.uniform(-2.0, 2.0), 1)
                elif m == "LIGHT":
                    val = round(2500.0 + random.uniform(-200.0, 300.0), 1)

                # Insert telemetry
                cursor.execute("""
                INSERT INTO telemetry (zone_id, device_id, metric, value, recorded_at)
                VALUES (?, ?, ?, ?, ?)
                """, (zone_id, device_id, m, val, now_iso))

                # Check thresholds
                cursor.execute("""
                SELECT warning_min, warning_max, danger_min, danger_max, auto_actions_json
                FROM thresholds WHERE zone_id = ? AND metric = ?
                """, (zone_id, m))
                thresh = cursor.fetchone()
                if thresh:
                    danger_min = thresh["danger_min"]
                    danger_max = thresh["danger_max"]
                    if val < danger_min or val > danger_max:
                        # Auto trigger action if defined
                        actions_json = thresh["auto_actions_json"]
                        if actions_json:
                            actions = json.loads(actions_json)
                            for act in actions:
                                if act.get("action") == "ON" and act.get("target_metric") == "PUMP":
                                    cursor.execute("""
                                    UPDATE actuator_states
                                    SET state = 'ON', last_action_at = ?
                                    WHERE device_id IN (
                                        SELECT id FROM devices WHERE zone_id = ? AND type = 'ACTUATOR' AND metrics_json LIKE '%PUMP%'
                                    ) AND mode = 'AUTO'
                                    """, (now_iso, zone_id))

                packet = {
                    "event": "telemetry",
                    "data": {
                        "zone_id": zone_id,
                        "device_id": device_id,
                        "metric": m,
                        "value": val,
                        "timestamp": now_iso
                    }
                }
                await self.broadcast(packet)

        conn.commit()
        conn.close()

simulator = TelemetrySimulator()
