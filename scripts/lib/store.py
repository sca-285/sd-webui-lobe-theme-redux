"""Server-side storage for the theme's own data: generation history, presets
and small per-user lists (favourite LoRAs, recent LoRAs, ...).

Everything lives in <extension>/lobe_data/, so it survives browser cache
clears and is shared by every browser and device that opens this WebUI.
Writes go to a temporary file first and are then renamed into place, so a
crash never leaves a half-written file behind.
"""
import base64
import json
import os
import re
import threading
import time
import uuid
from pathlib import Path
from typing import Any

from scripts.lib.lobe_log import LobeLog

EXTENSION_FOLDER = Path(__file__).parent.parent.parent
DATA_FOLDER = Path(EXTENSION_FOLDER, "lobe_data")
HISTORY_FOLDER = Path(DATA_FOLDER, "history")
THUMB_FOLDER = Path(HISTORY_FOLDER, "thumbs")
HISTORY_FILE = Path(HISTORY_FOLDER, "history.json")
USERDATA_FILE = Path(DATA_FOLDER, "userdata.json")

HISTORY_LIMIT = 2000                 # oldest entries (and their thumbnails) are dropped beyond this
THUMB_MAX_BYTES = 400 * 1024         # per thumbnail
THUMBS_PER_ENTRY = 16
USERDATA_KEYS = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{0,63}$")
THUMB_NAME = re.compile(r"^[0-9a-f]{32}_\d{1,2}\.(webp|jpg|png)$")
DATA_URL = re.compile(r"^data:image/(webp|jpeg|png);base64,(.+)$", re.S)


def _atomic_write_json(path: Path, data: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, path)


def _read_json(path: Path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default
    except (OSError, ValueError) as e:
        LobeLog.error(f"could not read {path}: {e}")
        return default


class LobeStore:
    def __init__(self):
        self.lock = threading.Lock()
        self.history = _read_json(HISTORY_FILE, [])
        if not isinstance(self.history, list):
            self.history = []
        self.userdata = _read_json(USERDATA_FILE, {})
        if not isinstance(self.userdata, dict):
            self.userdata = {}

    # ------------------------------------------------------------ user data

    def get_userdata(self, key: str):
        if not USERDATA_KEYS.match(key):
            raise ValueError("bad key")
        return self.userdata.get(key)

    def set_userdata(self, key: str, value: Any):
        if not USERDATA_KEYS.match(key):
            raise ValueError("bad key")
        if len(json.dumps(value)) > 2 * 1024 * 1024:
            raise ValueError("value too large")
        with self.lock:
            self.userdata[key] = value
            _atomic_write_json(USERDATA_FILE, self.userdata)

    # ------------------------------------------------------------ history

    def list_history(self, offset: int = 0, limit: int = 200, query: str = "", tab: str = ""):
        items = list(reversed(self.history))
        if tab:
            items = [e for e in items if e.get("tab") == tab]
        if query:
            words = query.lower().split()
            items = [e for e in items if all(w in e.get("infotext", "").lower() for w in words)]
        return {"total": len(items), "items": items[offset:offset + limit]}

    def _save_thumb(self, entry_id: str, index: int, data_url: str):
        match = DATA_URL.match(data_url or "")
        if not match:
            return None
        raw = base64.b64decode(match.group(2), validate=False)
        if len(raw) > THUMB_MAX_BYTES:
            return None
        ext = {"jpeg": "jpg"}.get(match.group(1), match.group(1))
        name = f"{entry_id}_{index}.{ext}"
        THUMB_FOLDER.mkdir(parents=True, exist_ok=True)
        with open(Path(THUMB_FOLDER, name), "wb") as f:
            f.write(raw)
        return name

    def add_history(self, payload: dict):
        infotext = str(payload.get("infotext") or "")[:20000]
        if not infotext.strip():
            raise ValueError("empty infotext")
        entry_id = uuid.uuid4().hex
        images = []
        for index, image in enumerate((payload.get("images") or [])[:THUMBS_PER_ENTRY]):
            if not isinstance(image, dict):
                continue
            url = str(image.get("url") or "")[:2000]
            thumb = self._save_thumb(entry_id, index, str(image.get("thumb") or ""))
            images.append({"url": url, "thumb": thumb})
        entry = {
            "id": entry_id,
            "time": float(payload.get("time") or time.time() * 1000),
            "tab": str(payload.get("tab") or "txt2img")[:32],
            "infotext": infotext,
            "images": images,
        }
        with self.lock:
            self.history.append(entry)
            dropped = self.history[:-HISTORY_LIMIT] if len(self.history) > HISTORY_LIMIT else []
            self.history = self.history[-HISTORY_LIMIT:]
            _atomic_write_json(HISTORY_FILE, self.history)
        for old in dropped:
            self._delete_thumbs(old)
        return entry

    def _delete_thumbs(self, entry: dict):
        for image in entry.get("images", []):
            name = image.get("thumb")
            if name and THUMB_NAME.match(name):
                try:
                    os.remove(Path(THUMB_FOLDER, name))
                except OSError:
                    pass

    def delete_history(self, entry_id: str):
        with self.lock:
            removed = [e for e in self.history if e.get("id") == entry_id]
            self.history = [e for e in self.history if e.get("id") != entry_id]
            _atomic_write_json(HISTORY_FILE, self.history)
        for entry in removed:
            self._delete_thumbs(entry)
        return len(removed)

    def clear_history(self):
        with self.lock:
            removed, self.history = self.history, []
            _atomic_write_json(HISTORY_FILE, self.history)
        for entry in removed:
            self._delete_thumbs(entry)
        return len(removed)

    @staticmethod
    def thumb_path(name: str):
        if not THUMB_NAME.match(name or ""):
            return None
        path = Path(THUMB_FOLDER, name)
        return path if path.is_file() else None
