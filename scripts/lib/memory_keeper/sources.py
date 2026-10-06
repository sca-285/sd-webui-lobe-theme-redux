"""Who holds memory: the checkpoint (its UNet, text encoders, VAE), the other models the memory manager placed
(ControlNet, IP-Adapter…), the caches of LoRA files and ControlNet models, the CLIP interrogator, and whatever
another extension registers in shared.memory_holders (Prompt Vault's Qwen, TIPO and WD14 among them).

Each one is a dict:
    id, name, detail                 what the panel shows; id is what a 🔒 is kept by
    category                         one of CATEGORIES (an unknown one is "other")
    source                           who told about it: an extension's name (optional)
    usage()                          {"vram": bytes, "ram": bytes} (None for a size not known), or None: not loaded
    to_ram()                         off the GPU, kept in RAM (optional)
    unload()                         let go of it altogether (optional)
    pid()                            the process it is, when it is one (optional)
    parts()                          [{"id", "name", "vram", "ram"}] (optional; the checkpoint's)
    part_to_ram(part_id)             one part off the GPU (optional)
    webui                            True: it touches what a generation uses, so not while one runs
"""

from __future__ import annotations

import importlib
import os
import sys

from . import measure

# the panel's sections, in this order; a holder names its category by the key
CATEGORIES = (
    ("checkpoint", "Checkpoint", "🧩"),
    ("lora", "LoRA", "🎨"),
    ("control", "ControlNet & adapters", "🕹️"),
    ("upscaler", "Upscalers", "🔍"),
    ("face", "Face restore & detailers", "🙂"),
    ("tagger", "Taggers & interrogators", "🏷️"),
    ("llm", "LLM / VLM", "💬"),
    ("other", "Other models", "📦"),
    ("process", "Other processes", "⚙️"),
)
CATEGORY_KEYS = tuple(c[0] for c in CATEGORIES)

# what a model the memory manager placed is, by its class name
_KINDS = (("control", ("controlnet", "controllora", "t2iadapter", "adapter", "ipadapter", "clipvision", "instantid", "revision")),
          ("upscaler", ("esrgan", "rrdb", "swinir", "dat", "hat", "scunet", "upscal", "spandrel")),
          ("face", ("gfpgan", "codeformer", "restoreformer", "yolo", "retinaface")))


def category_of(name):
    low = str(name).lower()
    for key, words in _KINDS:
        if any(w in low for w in words):
            return key
    return "other"


PARTS = (("unet", "UNet / diffusion model"), ("clip", "Text encoder (CLIP / T5)"), ("vae", "VAE"), ("clipvision", "CLIP vision"))


def manager():
    """The memory manager of the Forge family: Forge and Forge Classic/Neo, then reForge."""
    for path in ("backend.memory_management", "ldm_patched.modules.model_management"):
        try:
            return importlib.import_module(path)
        except Exception:
            continue
    return None


def empty_cache():
    mm = manager()
    try:
        if mm is not None and callable(getattr(mm, "soft_empty_cache", None)):
            try:
                mm.soft_empty_cache(force=True)
            except TypeError:
                mm.soft_empty_cache()
            return
    except Exception:
        pass
    torch = measure._torch()
    try:
        if torch is not None and torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
    except Exception:
        pass


def _loaded():
    mm = manager()
    return list(getattr(mm, "current_loaded_models", None) or []) if mm is not None else []


def _module_of(lm):
    patcher = getattr(lm, "model", None)
    return getattr(patcher, "model", None)


def _off_gpu(module):
    """The memory manager's loaded models that are this torch module, taken off the GPU (to RAM). How many."""
    mm = manager()
    if mm is None:
        return 0
    moved = 0
    for lm in list(getattr(mm, "current_loaded_models", None) or []):
        if _module_of(lm) is module:
            try:
                mm.current_loaded_models.remove(lm)
            except ValueError:
                continue
            try:
                lm.model_unload()
            except TypeError:  # reForge: model_unload(memory_to_free=None, unpatch_weights=True)
                lm.model_unload(None, True)
            moved += 1
    return moved


# ------------------------------------------------------------------ the checkpoint


def _sd_model():
    try:
        from modules import shared

        model = shared.sd_model
    except Exception:
        return None
    if model is None or type(model).__name__ == "FakeInitialModel":
        return None
    return model


def _parts(model):
    """[(key, label, torch module)] of the checkpoint."""
    objects = getattr(model, "forge_objects", None)
    out = []
    if objects is not None:
        for key, label in PARTS:
            obj = getattr(objects, key, None)
            if obj is None:
                continue
            patcher = getattr(obj, "patcher", obj)  # CLIP and VAE wrap their patcher
            module = getattr(patcher, "model", None)
            if module is not None:
                out.append((key, label, module))
    elif hasattr(model, "parameters"):  # A1111: one module
        out.append(("model", "Checkpoint", model))
    return out


def _ckpt_name(model):
    info = getattr(model, "sd_checkpoint_info", None)
    name = getattr(info, "name_for_extra", None) or getattr(info, "model_name", None) or getattr(info, "title", None)
    if not name:
        name = os.path.splitext(os.path.basename(str(getattr(model, "filename", "") or "checkpoint")))[0]
    return str(name)


def can_unload_checkpoint():
    """Forge (and Classic/Neo) load the checkpoint again by themselves on the next generation."""
    try:
        from modules import sd_models
    except Exception:
        return False
    return callable(getattr(sd_models, "forge_model_reload", None)) and hasattr(getattr(sd_models, "model_data", None), "forge_hash") \
        and hasattr(sd_models, "FakeInitialModel")


def checkpoint_to_ram():
    model = _sd_model()
    if model is None:
        return
    parts = _parts(model)
    if getattr(model, "forge_objects", None) is not None or manager() is not None:
        for _key, _label, module in parts:
            _off_gpu(module)
    else:
        from modules import sd_models

        sd_models.unload_model_weights()


def checkpoint_part_to_ram(key):
    model = _sd_model()
    for k, _label, module in _parts(model) if model is not None else []:
        if k == key:
            _off_gpu(module)


def unload_checkpoint():
    """Out of the GPU and out of RAM; the next generation loads it again (Forge does, as at start)."""
    from modules import sd_models

    model = _sd_model()
    if model is None:
        return
    for _key, _label, module in _parts(model):
        _off_gpu(module)
    sd_models.model_data.sd_model = sd_models.FakeInitialModel()
    sd_models.model_data.forge_hash = ""
    del model


def _checkpoint():
    model = _sd_model()
    if model is None:
        return []
    def parts():
        current = _sd_model()
        out = []
        for key, label, module in _parts(current) if current is not None else []:
            size = measure.module_bytes(module)
            out.append({"id": key, "name": label, "vram": size["vram"], "ram": size["ram"]})
        return out

    def usage():
        p = parts()
        return {"vram": sum(x["vram"] for x in p), "ram": sum(x["ram"] for x in p)} if p else None

    return [{"id": "checkpoint", "name": _ckpt_name(model), "category": "checkpoint", "kind": "model",
             "detail": "Unloaded, it is loaded again by the next generation" if can_unload_checkpoint() else "",
             "usage": usage, "parts": parts, "part_to_ram": checkpoint_part_to_ram, "to_ram": checkpoint_to_ram,
             "unload": unload_checkpoint if can_unload_checkpoint() else None, "webui": True}]


# ------------------------------------------------------------------ other models the memory manager placed


def _others():
    model = _sd_model()
    mine = {id(m) for _k, _l, m in _parts(model)} if model is not None else set()
    out, seen = [], set()
    for lm in _loaded():
        module = _module_of(lm)
        if module is None or id(module) in mine or id(module) in seen:
            continue
        seen.add(id(module))
        name = type(module).__name__
        out.append({"id": "model:" + name, "name": name, "category": category_of(name), "kind": "model",
                    "detail": "On the GPU, placed by the memory manager; its file stays cached in RAM",
                    "usage": (lambda m=module: measure.module_bytes(m)), "to_ram": (lambda m=module: _off_gpu(m)),
                    "unload": None, "webui": True})
    return out


# ------------------------------------------------------------------ caches


def _find_global(name):
    """A function the WebUI's builtin extensions keep at module level (they are loaded under several names)."""
    for module in list(sys.modules.values()):
        fn = getattr(module, name, None) if module is not None else None
        if callable(getattr(fn, "cache_clear", None)):
            return fn
    try:  # scripts are loaded without a sys.modules entry: look in their functions' globals
        from modules import scripts

        for runner in (getattr(scripts, "scripts_txt2img", None), getattr(scripts, "scripts_img2img", None)):
            for script in getattr(runner, "scripts", None) or []:
                for attr in vars(type(script)).values():
                    g = getattr(attr, "__globals__", None)
                    if g and callable(getattr(g.get(name), "cache_clear", None)):
                        return g[name]
    except Exception:
        pass
    return None


def _lru(id_, name, category, fn_name, what, detail):
    fn = _find_global(fn_name)
    if fn is None:
        return []

    def usage():
        n = fn.cache_info().currsize
        return {"vram": None, "ram": None, "count": n, "what": what} if n else None

    return [{"id": id_, "name": name, "category": category, "kind": "cache", "detail": detail, "usage": usage,
             "unload": fn.cache_clear, "webui": True}]


def _clipvision_cache():
    try:
        from modules_forge.supported_preprocessor import PreprocessorClipVision
    except Exception:
        return []
    cache = PreprocessorClipVision.global_cache

    def usage():
        return {"vram": None, "ram": None, "count": len(cache), "what": "model"} if cache else None

    return [{"id": "cache:clipvision", "name": "CLIP vision cache (IP-Adapter, Revision)", "category": "control", "kind": "cache",
             "detail": "Preprocessor models, loaded again when used", "usage": usage, "unload": cache.clear, "webui": True}]


def _interrogator():
    try:
        from modules import shared

        it = shared.interrogator
    except Exception:
        return []
    if it is None:
        return []

    def usage():
        held = [getattr(it, n, None) for n in ("clip_model", "blip_model")]
        held = [m for m in held if m is not None]
        if not held:
            return None
        total = {"vram": 0, "ram": 0}
        for m in held:
            size = measure.module_bytes(m)
            total["vram"] += size["vram"]
            total["ram"] += size["ram"]
        return total

    def unload():
        it.unload()
        for n in ("clip_model", "blip_model", "clip_preprocess", "dtype"):
            if hasattr(it, n):
                setattr(it, n, None)

    return [{"id": "interrogator", "name": "CLIP / BLIP interrogator", "category": "tagger", "kind": "model",
             "detail": "img2img's Interrogate CLIP", "usage": usage, "unload": unload, "webui": True}]


def _face_restorers():
    """GFPGAN and CodeFormer keep their network once used (and a face detector beside it)."""
    try:
        from modules import shared

        restorers = list(getattr(shared, "face_restorers", None) or [])
    except Exception:
        return []
    out = []
    for fr in restorers:
        if not hasattr(fr, "net"):
            continue
        name = fr.name() if callable(getattr(fr, "name", None)) else type(fr).__name__

        def usage(fr=fr):
            helper = fr.__dict__.get("face_helper")  # facexlib's helper: a face detector and a face parser
            held = [m for m in (fr.net, getattr(helper, "face_det", None), getattr(helper, "face_parse", None)) if m is not None]
            if not held:
                return None
            total = {"vram": 0, "ram": 0}
            for m in held:
                for k, v in measure.module_bytes(m).items():
                    total[k] += v
            return total

        def to_ram(fr=fr):
            if callable(getattr(fr, "send_model_to", None)):
                fr.send_model_to("cpu")

        def unload(fr=fr):
            fr.net = None
            fr.__dict__.pop("face_helper", None)  # a cached_property: made again when used

        out.append({"id": "face:" + name, "name": name, "category": "face", "kind": "model", "usage": usage,
                    "detail": "Restore faces; loaded again when used", "to_ram": to_ram, "unload": unload, "webui": True})
    return out


def _caches():
    return (_lru("cache:lora", "LoRA files", "lora", "load_lora_state_dict", "file", "Read again from disk when used")
            + _lru("cache:controlnet", "ControlNet models", "control", "cached_controlnet_loader", "model", "Loaded again when used")
            + _clipvision_cache() + _interrogator() + _face_restorers())


# ------------------------------------------------------------------ other extensions


def registered():
    try:
        from modules import shared

        out = []
        for h in list(getattr(shared, "memory_holders", None) or []):
            if isinstance(h, dict) and h.get("id") and callable(h.get("usage")):
                category = h.get("category") if h.get("category") in CATEGORY_KEYS else "other"
                out.append(dict(h, category=category, source=h.get("source") or h.get("group") or ""))
        return out
    except Exception:
        return []


def holders():
    out = []
    for source in (_checkpoint, _others, _caches, registered):
        try:
            out += source()
        except Exception as exc:
            print(f"[Memory Keeper] {source.__name__}: {exc}")
    return out
