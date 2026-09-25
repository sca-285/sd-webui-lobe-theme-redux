"""What the sidebar needs to know about each LoRA that the WebUI's cards do not
say: the model family it was trained for, and its trigger words.

The list itself comes from the WebUI's own LoRA module (`networks`, present in
A1111, reForge, Forge and Forge Classic), so names match the cards exactly.
Headers are read once per file and cached by modification time.
"""
import json
import os
import re
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


# Model families use Forge Classic (Neo)'s UI preset names, plus sd2 and sd3
# for the WebUIs that still load them.
FAMILIES = ("sd", "sd2", "xl", "sd3", "flux", "klein", "qwen", "lumina", "zit",
            "wan", "anima", "ernie", "pid", "krea")

# (words in the training metadata, family); checked in this order, so the
# more specific names come first
_NAMED = (
    (("flux.2", "flux2", "flux-2", "flux_2", "klein"), "klein"),
    (("chroma", "flux"), "flux"),
    (("qwen",), "qwen"),
    (("z-image", "z_image", "zimage"), "zit"),
    (("lumina",), "lumina"),
    (("wan2", "wan-2", "wan_2", "wan 2", "wan21", "wan22", "wan"), "wan"),
    (("anima", "cosmos"), "anima"),
    (("ernie",), "ernie"),
    (("pixeldit", "pid"), "pid"),
    (("krea",), "krea"),
    (("sd3", "stable-diffusion-3", "sd-3"), "sd3"),
    (("sdxl", "xl", "pony", "illustrious", "noobai"), "xl"),
    (("v2", "sd_v2", "stable-diffusion-v2", "sd2"), "sd2"),
    (("v1", "sd_v1", "sd1", "stable-diffusion-v1"), "sd"),
)


_WHOLE_WORDS = {"anima", "ernie", "krea", "wan", "pid", "qwen", "pony"}


def _family_from_text(text: str):
    text = text.lower()
    if not text:
        return None
    for words, family in _NAMED:
        for word in words:
            # short names only at the start of a word ("pid" in "rapid" is not
            # PiD), and some only as a whole word ("animagine" is SDXL, not Anima)
            if len(word) <= 5:
                tail = "(?![a-z])" if word in _WHOLE_WORDS else ""
                if re.search(rf"(?<![a-z]){re.escape(word)}{tail}", text):
                    return family
            elif word in text:
                return family
    return None


def _norm(key: str) -> str:
    """One spelling for every LoRA key format (kohya, PEFT/diffusers, ComfyUI)."""
    key = key.lower()
    for prefix in ("lora_unet_", "lora_transformer_", "lycoris_", "base_model.model.", "transformer.", "diffusion_model.", "model.diffusion_model.", "unet."):
        if key.startswith(prefix):
            key = key[len(prefix):]
    return key.replace(".", "_")


def _in_out(header: dict, key: str):
    """(in, out) features of the layer a LoRA down/up weight belongs to."""
    shape = (header.get(key) or {}).get("shape") or []
    if len(shape) < 2:
        return None
    if "lora_down" in key or "lora_a" in key.lower():
        return shape[1], None
    if "lora_up" in key or "lora_b" in key.lower():
        return None, shape[0]
    return None


def _layer_io(header: dict, raw_keys: list, pattern: str):
    """(in, out) of the first layer whose normalised key matches `pattern`."""
    rx = re.compile(pattern)
    found_in = found_out = None
    for key in raw_keys:
        if not rx.search(_norm(key)):
            continue
        io = _in_out(header, key)
        if not io:
            continue
        found_in = found_in or io[0]
        found_out = found_out or io[1]
        if found_in and found_out:
            break
    return found_in, found_out


def _family_from_keys(header: dict):
    raw = [k for k in header if k != "__metadata__"]
    if not raw:
        return None
    joined = " ".join(_norm(k) for k in raw[:6000])

    # BFL layout (Flux.1, Chroma, Flux.2): the width of the fused layers tells them apart
    if "double_blocks_" in joined or "single_blocks_" in joined:
        i, o = _layer_io(header, raw, r"single_blocks_\d+_linear1_")
        if i and o:
            return "klein" if o >= 8.5 * i else "flux"      # 9h vs 7h
        i, o = _layer_io(header, raw, r"double_blocks_\d+_img_mlp_0_")
        if i and o:
            return "klein" if o >= 5.5 * i else "flux"      # 6h vs 4h
        return "flux"
    # diffusers layout
    if "text_fusion_" in joined or re.search(r"transformer_blocks_\d+_(attn_to_gate|ff_(gate|up|down))_", joined):
        return "krea"
    if "to_qkv_mlp_proj" in joined or re.search(r"transformer_blocks_\d+_ff(_context)?_linear_in", joined):
        return "klein"
    if re.search(r"transformer_blocks_\d+_(img|txt)_mlp", joined) or re.search(r"transformer_blocks_\d+_(img|txt)_mod", joined):
        return "qwen"
    if "single_transformer_blocks_" in joined:
        return "flux"
    if "txtfusion_" in joined or re.search(r"blocks_\d+_attn_w[qkvo]_", joined):
        return "krea"
    if re.search(r"layers_\d+_self_attention_to_[qkv]_", joined) or re.search(r"layers_\d+_mlp_linear_fc2", joined):
        return "ernie"
    if re.search(r"blocks_\d+_(attn_)?qkv_[xy]_", joined) or "lq_proj_" in joined:
        return "pid"
    if "llm_adapter_" in joined or re.search(r"blocks_\d+_(self|cross)_attn_[qkvo]_proj_", joined) or re.search(r"blocks_\d+_mlp_layer[12]_", joined):
        return "anima"
    if re.search(r"blocks_\d+_(self|cross)_attn_[qkvo]_", joined) or re.search(r"blocks_\d+_ffn_[02]_", joined) \
            or re.search(r"(?<!transformer_)blocks_\d+_attn[12]_to_[qkv]_", joined):
        return "wan"
    if "noise_refiner_" in joined or "context_refiner_" in joined or re.search(r"layers_\d+_(attention|feed_forward)_", joined):
        # Lumina 2 and Z-Image share the layout; the width differs (2304 / 3840)
        i, _ = _layer_io(header, raw, r"layers_\d+_(attention_(qkv|to_q)|feed_forward_w[13])_")
        return "zit" if i and i >= 3000 else "lumina"
    if "joint_blocks_" in joined:
        return "sd3"
    # diffusers double-stream blocks alone: Qwen-Image has 60, Flux.1 has 19
    blocks = [int(n) for n in re.findall(r"(?<![a-z])transformer_blocks_(\d+)_attn_(?:to|add)_", joined)]
    if blocks:
        return "qwen" if max(blocks) >= 19 else "flux"
    if "lora_te2_" in joined or "lora_te1_" in joined or "input_blocks_4_1_transformer_blocks_1" in joined \
            or "down_blocks_1_attentions_0_transformer_blocks_1" in joined:
        return "xl"
    for key in raw:
        if key.startswith("lora_te_") and key.endswith("lora_down.weight"):
            shape = header[key].get("shape") or []
            if len(shape) == 2:
                return "sd2" if shape[1] == 1024 else "sd"
    if any(k.startswith("lora_unet_") for k in raw):
        return "sd"
    return None


def _arch_from(metadata: dict, header: dict, user: dict | None = None) -> str:
    # 1. what the user set in the card's metadata editor (Neo: "Preset")
    chosen = str((user or {}).get("sd version", "")).strip().lower()
    if chosen in FAMILIES:
        return chosen
    # 2. what the trainer wrote
    for field in ("modelspec.architecture", "ss_base_model_version", "ss_base_model", "base_model"):
        family = _family_from_text(str(metadata.get(field, "")))
        if family:
            return family
    # 3. the layer names and widths
    return _family_from_keys(header) or "unknown"


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
            user = _read_json(os.path.splitext(filename)[0] + ".json")
            info = {"arch": _arch_from(metadata, header, user if isinstance(user, dict) else None),
                    "triggerWords": _trigger_words(filename, metadata)}
            _cache[filename] = (mtime, info)
        else:
            info = cached[1]
        try:
            alias = net.get_alias()
        except Exception:
            alias = getattr(net, "alias", name)
        result.append({"name": name, "alias": alias, **info})
    return result


# Forge / Forge Classic diffusion engine classes -> family
_ENGINES = {
    "StableDiffusion": "sd", "StableDiffusion2": "sd2", "StableDiffusionXL": "xl",
    "StableDiffusionXLRefiner": "xl", "Mugen": "xl", "StableDiffusion3": "sd3",
    "Flux": "flux", "Chroma": "flux", "Flux2": "klein", "QwenImage": "qwen",
    "Lumina2": "lumina", "ZImage": "zit", "Wan": "wan", "Anima": "anima",
    "ErnieImage": "ernie", "PiD": "pid", "Krea2": "krea",
}


def current_model():
    """The loaded checkpoint's family, without triggering a model load."""
    arch = "unknown"
    name = ""
    try:
        from modules import sd_models, shared
        name = str(getattr(shared.opts, "sd_model_checkpoint", "") or "")
        model = getattr(sd_models.model_data, "sd_model", None)
        if model is not None and name and getattr(model, "sd_checkpoint_info", None) is not None:
            engine = _ENGINES.get(type(model).__name__)
            if engine:
                arch = engine
            elif getattr(model, "is_flux", False) or "flux" in type(model).__name__.lower():
                arch = "flux"
            elif getattr(model, "is_sd3", False):
                arch = "sd3"
            elif getattr(model, "is_sdxl", False):
                arch = "xl"
            elif getattr(model, "is_sd2", False):
                arch = "sd2"
            elif getattr(model, "is_sd1", False) or (
                    not hasattr(model, "is_sd1") and hasattr(model, "cond_stage_model")):
                arch = "sd"
    except Exception as e:
        LobeLog.debug(f"current_model: {e}")
    return {"checkpoint": name, "arch": arch}
