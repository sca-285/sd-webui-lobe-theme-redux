"""How much: the GPU's memory and the RAM as a whole, a model's weights by where they are, a process's share.

Nothing here needs torch or psutil to be importable; without them the numbers are just missing."""

from __future__ import annotations

import os
import shutil
import subprocess
import time

GPU_TYPES = {"cuda", "xpu", "mps", "privateuseone"}  # privateuseone: DirectML


def _torch():
    try:
        import torch

        return torch
    except Exception:
        return None


def _psutil():
    try:
        import psutil

        return psutil
    except Exception:
        return None


def module_bytes(module):
    """{"vram", "ram"}: the bytes of a torch module's weights on the GPU and in RAM (each tensor once)."""
    out = {"vram": 0, "ram": 0}
    if module is None:
        return out
    seen = set()
    try:
        tensors = list(module.parameters()) + list(module.buffers())
    except Exception:
        return out
    for t in tensors:
        key = id(t)
        if key in seen:
            continue
        seen.add(key)
        try:
            kind = t.device.type
            size = t.numel() * t.element_size()
        except Exception:
            continue
        if kind in GPU_TYPES:
            out["vram"] += size
        elif kind == "cpu":
            out["ram"] += size
    return out


def gpu():
    """{"name", "total", "free", "webui"} of the GPU torch uses, or None (no GPU, no torch)."""
    torch = _torch()
    if torch is None:
        return None
    try:
        if torch.cuda.is_available():
            free, total = torch.cuda.mem_get_info()
            return {"name": torch.cuda.get_device_name(), "total": total, "free": free,
                    "webui": torch.cuda.memory_reserved(), "allocated": torch.cuda.memory_allocated()}
    except Exception:
        pass
    return None


def ram():
    """{"total", "free", "webui"}: the computer's RAM and what this WebUI process holds, or None."""
    psutil = _psutil()
    if psutil is None:
        return None
    try:
        vm = psutil.virtual_memory()
        me = psutil.Process().memory_info()
        return {"total": vm.total, "free": vm.available, "webui": me.rss}
    except Exception:
        return None


def process_ram(pid):
    psutil = _psutil()
    if psutil is None or not pid:
        return None
    try:
        return psutil.Process(pid).memory_info().rss  # with the model's mapped file pages: what it really occupies
    except Exception:
        return None


def children():
    """[(pid, name, ram)] of the processes this WebUI started (llama-server and the like)."""
    psutil = _psutil()
    if psutil is None:
        return []
    out = []
    try:
        for p in psutil.Process().children(recursive=True):
            try:
                out.append((p.pid, p.name(), p.memory_info().rss))
            except Exception:
                continue
    except Exception:
        pass
    return out


_SMI = {"at": 0.0, "by_pid": {}}


def gpu_by_pid():
    """{pid: bytes} from nvidia-smi, for the processes it can tell (on Windows it often cannot: then {})."""
    if time.time() - _SMI["at"] < 2.0:
        return _SMI["by_pid"]
    found = {}
    smi = shutil.which("nvidia-smi")
    if smi:
        try:
            out = subprocess.run([smi, "--query-compute-apps=pid,used_memory", "--format=csv,noheader,nounits"],
                                 capture_output=True, text=True, timeout=3,
                                 creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)).stdout
            for line in out.splitlines():
                pid, _, mib = line.partition(",")
                if pid.strip().isdigit() and mib.strip().isdigit():
                    found[int(pid)] = int(mib) * 1024 * 1024
        except Exception:
            pass
    _SMI.update(at=time.time(), by_pid=found)
    return found


def give_back_ram():
    """What Python freed, handed back to the system: Windows trims the working set, Linux trims the heap."""
    try:
        import ctypes

        if os.name == "nt":
            handle = ctypes.windll.kernel32.GetCurrentProcess()
            ctypes.windll.psapi.EmptyWorkingSet(handle)
        else:
            ctypes.CDLL("libc.so.6").malloc_trim(0)
        return True
    except Exception:
        return False
