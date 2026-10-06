"""VRAM mode: the memory manager's VRAM state (High, Normal, Low), changed while the WebUI runs.

Forge, Forge Classic/Neo and reForge all keep it in one module global, `vram_state`, read again each time a model
is loaded, so setting it is enough for what is loaded next. What is loaded already stays where it is: the models
are taken off the GPU, and the checkpoint is unloaded so its text encoder is placed again (Normal and High keep it
on the GPU, Low in RAM). Not kept across restarts: the WebUI starts in the state its command line asks for.
"""

from __future__ import annotations

from . import TAG, sources

MODES = {"high": "HIGH_VRAM", "normal": "NORMAL_VRAM", "low": "LOW_VRAM"}
NAMES = {v: k for k, v in MODES.items()}


def _state_name(mm):
    state = getattr(mm, "vram_state", None)
    return getattr(state, "name", None)


_mm = sources.manager()
STARTUP = NAMES.get(_state_name(_mm)) if _mm is not None else None  # what the command line gave, at start


def info():
    """{"mode", "startup", "can"}: mode is high / normal / low, or the state's own name when it is none of them
    (NO_VRAM, DISABLED on the CPU, SHARED on Apple silicon), where this switch does not apply."""
    mm = sources.manager()
    if mm is None or not hasattr(mm, "VRAMState"):
        return None
    name = _state_name(mm)
    return {"mode": NAMES.get(name, (name or "").lower()), "startup": STARTUP, "can": name in NAMES}


def set_mode(mode, locked=True):
    """Switch, then let go of what was placed under the old mode. Returns what was done."""
    from . import keeper  # keeper imports this module for its status

    if mode not in MODES:
        raise keeper.Missing("VRAM mode: high, normal or low.")
    mm = sources.manager()
    current = info()
    if current is None:
        raise keeper.Missing("This WebUI has no memory manager with a VRAM state.")
    if not current["can"]:
        raise keeper.Missing(f"The GPU runs in {current['mode'].upper()} mode here: this switch does not apply.")
    if mode == "low" and not getattr(mm, "lowvram_available", True):
        raise keeper.Missing("Low VRAM is not available on this GPU.")
    if current["mode"] == mode:
        return {"mode": mode, "done": [], "skipped": []}

    with keeper._Quiet(locked):
        mm.vram_state = mm.VRAMState[MODES[mode]]
        print(f"{TAG} VRAM mode: {current['mode']} → {mode}")
        # what was placed under the old mode goes; the next generation places it again under the new one
        result = keeper.free("vram", locked=False)
        done, skipped = list(result.get("done") or []), list(result.get("skipped") or [])
        if "checkpoint" in keeper.pins():
            skipped.append("the checkpoint is kept (🔒): its text encoder stays where it is until it loads again")
        elif sources.can_unload_checkpoint():
            if sources._sd_model() is not None:
                sources.unload_checkpoint()
                keeper.cleanup(give_back=False)
                done.append("checkpoint (loaded again by the next generation)")
        else:
            skipped.append("the checkpoint's text encoder moves when the checkpoint is loaded again")
    return {"mode": mode, "done": done, "skipped": skipped}
