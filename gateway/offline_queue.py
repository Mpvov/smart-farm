from __future__ import annotations

import sqlite3
import time
from typing import List, Tuple


class OfflineTelemetryQueue:
    """Persistent FIFO queue storing at least 1,000 readings during outages (NFR-03)."""

    def __init__(self, db_path: str = "gateway_offline.db", max_rows: int = 2000) -> None:
        self._max_rows = max_rows
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS pending_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric TEXT NOT NULL,
                value REAL NOT NULL,
                created_at REAL NOT NULL
            )
            """
        )
        self._conn.commit()

    def push(self, metric: str, value: float) -> None:
        self._conn.execute(
            "INSERT INTO pending_telemetry (metric, value, created_at) VALUES (?, ?, ?)",
            (metric, value, time.time()),
        )
        self._conn.execute(
            """
            DELETE FROM pending_telemetry
            WHERE id NOT IN (
                SELECT id FROM pending_telemetry ORDER BY id DESC LIMIT ?
            )
            """,
            (self._max_rows,),
        )
        self._conn.commit()

    def peek_batch(self, limit: int = 5) -> List[Tuple[int, str, float]]:
        cur = self._conn.execute(
            "SELECT id, metric, value FROM pending_telemetry ORDER BY id ASC LIMIT ?",
            (limit,),
        )
        return [(int(r[0]), str(r[1]), float(r[2])) for r in cur.fetchall()]

    def delete_ids(self, row_ids: List[int]) -> None:
        if not row_ids:
            return
        placeholders = ",".join("?" for _ in row_ids)
        self._conn.execute(f"DELETE FROM pending_telemetry WHERE id IN ({placeholders})", row_ids)
        self._conn.commit()

    def count(self) -> int:
        cur = self._conn.execute("SELECT COUNT(*) FROM pending_telemetry")
        return int(cur.fetchone()[0])

    def close(self) -> None:
        self._conn.close()