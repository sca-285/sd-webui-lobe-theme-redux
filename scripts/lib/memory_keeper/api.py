"""The routes the theme's Memory card talks to: /lobe/memory/..."""

from __future__ import annotations

from . import TAG, VERSION, keeper

BASE = "/lobe/memory"


def register(app):
    from fastapi import Body
    from fastapi.responses import JSONResponse

    def run(fn):
        try:
            return fn()
        except keeper.Busy as exc:
            return JSONResponse({"error": str(exc), "busy": True}, status_code=409)
        except keeper.Missing as exc:
            return JSONResponse({"error": str(exc)}, status_code=400)
        except Exception as exc:
            print(f"{TAG} {type(exc).__name__}: {exc}")
            return JSONResponse({"error": f"{type(exc).__name__}: {exc}"}, status_code=500)

    @app.get(f"{BASE}/status")
    def status(full: int = 0):
        return run(lambda: dict(keeper.status(full=bool(full)), version=VERSION))

    @app.post(f"{BASE}/act")
    def act(body: dict = Body(...)):
        return run(lambda: keeper.act(str(body.get("id") or ""), str(body.get("action") or "ram"), body.get("part")))

    @app.post(f"{BASE}/pin")
    def pin(body: dict = Body(...)):
        return run(lambda: {"pinned": keeper.pin(str(body.get("id") or ""), bool(body.get("keep")))})

    @app.post(f"{BASE}/free")
    def free(body: dict = Body(...)):
        return run(lambda: keeper.free(str(body.get("level") or "vram"), category=body.get("category") or None))
