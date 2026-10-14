from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any


class JsonlWriter:
    def __init__(self, output: str | Path):
        self.output = Path(output)
        self.output.parent.mkdir(parents=True, exist_ok=True)
        self.file = self.output.open("a", encoding="utf-8", buffering=1)
        self.lock = threading.Lock()

    def write(self, record: dict[str, Any]) -> None:
        with self.lock:
            self.file.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")

    def close(self) -> None:
        self.file.close()
