"""What the sidebar needs to know about each LoRA that the WebUI's cards do not
say: the model family it was trained for, and its trigger words.

The list itself comes from the WebUI's own LoRA module (`networks`, present in
A1111, reForge, Forge and Forge Classic), so names match the cards exactly.
Headers are read once per file and cached by modification time.
"""
import json
import os
import struct
import sys
from collections import Counter

from scripts.lib.lobe_log import LobeLog

_cache: dict = {}   # filename -> (mtime, info)


def _read_header(filename: str):
    """The JSON header of a .safetensors file (tensor names, shapes, metadata)."""
    try:
        with open(filename, "rb") as f:
            size = struct.unpack("<Q", f.read(8))[0]
            if size <= 0 or size > 64 * 1024 * 1024:
                return {}
            return json.loads(f.read(size))
    except Exception:
        return {}


def _arch_from(metadata: dict, header: dict) -> str:
    spec = str(metadata.get("modelspec.architecture", "")).lower()
    base = str(metadata.get("ss_base_model_version", "")).lower()
    for text in (spec, base):
        if "flux" in text:
            return "flux"
        if "sd3" in text or "stable-diffusion-3" in text:
            return "sd3"
        if "xl" in text:
            return "sdxl"
        if "v2" in text or "sd_v2" in text or "stable-diffusion-v2" in text:
            return "sd2"
        if "v1" in text or "sd_v1" in text:
            return "sd1"
    keys = [k for k in header if k != "__metadata__"]
    joined = " ".join(keys[:4000])
    if "double_blocks" in joined or "single_blocks" in joined or "single_transformer_blocks" in joined:
        return "flux"
    if "joint_blocks" in joined:
        return "sd3"
    if "lora_te2_" in joined or "lora_te1_" in joined or "input_blocks_4_1_transformer_blocks_1" in joined \
            or "down_blocks_1_attentions_0_transformer_blocks_1" in joined:
        return "sdxl"
    for key in keys:
        if key.startswith("lora_te_") and key.endswith("lora_down.weight"):
            shape = header[key].get("shape") or []
            if len(shape) == 2:
                return "sd2" if shape[1] == 1024 else "sd1"
    if any(k.startswith("lora_unet_") for k in keys):
        return "sd1"
    return "unknown"


def _trigger_words(filename: str, metadata: dict):
    words = []
    stem = os.path.splitext(filename)[0]
    # the WebUI's own "activation text" (Edit metadata on the card)
    user = _read_json(stem + ".json")
    if isinstance(user, dict) and user.get("activation text"):
        words += [w.strip() for w in str(user["activation text"]).split(",") if w.strip()]
    # Civitai Helper / Civitai Browser+ sidecar
    civitai = _read_json(stem + ".civitai.info")
    if isinstance(civitai, dict):
        for w in civitai.get("trainedWords") or []:
            words += [x.strip() for x in str(w).split(",") if x.strip()]
    if not words:
        # most frequent training tags
        try:
            freq = metadata.get("ss_tag_frequency") or {}
            if isinstance(freq, str):   # the WebUI may already have decoded it
                freq = json.loads(freq)
            counter = Counter()
            for tags in freq.values():
                counter.update(tags)
            words = [tag for tag, _ in counter.most_common(5)]
        except Exception:
            pass
    return list(dict.fromkeys(words))[:12]


def _read_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def list_loras():
    networks = sys.modules.get("networks")
    available = getattr(networks, "available_networks", None) if networks else None
    if not isinstance(available, dict):
        return []
    result = []
    for name, net in list(available.items()):
        filename = getattr(net, "filename", "")
        try:
            mtime = os.path.getmtime(filename)
        except OSError:
            continue
        cached = _cache.get(filename)
        if not cached or cached[0] != mtime:
            metadata = dict(getattr(net, "metadata", {}) or {})
            header = _read_header(filename) if filename.lower().endswith(".safetensors") else {}
            info = {"arch": _arch_from(metadata, header), "triggerWords": _trigger_words(filename, metadata)}
            _cache[filename] = (mtime, info)
        else:
            info = cached[1]
        try:
            alias = net.get_alias()
        except Exception:
            alias = getattr(net, "alias", name)
        result.append({"name": name, "alias": alias, **info})
    return result


def current_model():
    """The loaded checkpoint's family, without triggering a model load."""
    arch = "unknown"
    name = ""
    try:
        from modules import sd_models, shared
        name = str(getattr(shared.opts, "sd_model_checkpoint", "") or "")
        model = getattr(sd_models.model_data, "sd_model", None)
        if model is not None and name and getattr(model, "sd_checkpoint_info", None) is not None:
            if getattr(model, "is_flux", False) or "flux" in type(model).__name__.lower():
                arch = "flux"
            elif getattr(model, "is_sd3", False):
                arch = "sd3"
            elif getattr(model, "is_sdxl", False):
                arch = "sdxl"
            elif getattr(model, "is_sd2", False):
                arch = "sd2"
            elif getattr(model, "is_sd1", False) or (
                    not hasattr(model, "is_sd1") and hasattr(model, "cond_stage_model")):
                arch = "sd1"
    except Exception as e:
        LobeLog.debug(f"current_model: {e}")
    return {"checkpoint": name, "arch": arch}
