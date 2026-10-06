"""Memory Keeper, the server half of the theme's Memory card (under System in the Quick Setting sidebar):
what holds the VRAM and the RAM, and letting go of it, all of it or one thing at a time, except what is kept.
The card is src/features/QuickSettingSidebar/MemoryKeeper.tsx; the work is in scripts/lib/memory_keeper."""

import os

from modules import script_callbacks, scripts, shared

from scripts.lib.memory_keeper import TAG, api, keeper

if not isinstance(getattr(shared, "memory_holders", None), list):
    shared.memory_holders = []  # other extensions add theirs here (Prompt Vault's Qwen, TIPO, WD14...)


def standalone_installed():
    """The sd-webui-memory-keeper extension, still enabled: it frees after generations itself."""
    try:
        from modules import extensions

        return any(os.path.isdir(os.path.join(e.path, "lib_memory_keeper")) for e in extensions.active())
    except Exception:
        return False


_routes_added = set()


def on_app_started(_demo, app):
    if id(app) in _routes_added:
        return
    _routes_added.add(id(app))
    try:
        api.register(app)
    except Exception as exc:
        print(f"{TAG} the routes could not be added: {exc}")
    if standalone_installed():
        print(f"{TAG} the sd-webui-memory-keeper extension is enabled too: remove it, the theme does its work now")


def on_ui_settings():
    import gradio as gr

    section = ("memory_keeper", "Memory Keeper")
    shared.opts.add_option("mk_after_generation", shared.OptionInfo(
        "Off", "After each generation", gr.Radio, {"choices": ["Off", "Free VRAM", "Free RAM", "Free VRAM and RAM"]}, section=section)
        .info("what you keep (🔒) stays; Free RAM leaves what is on the GPU; Free VRAM and RAM loads the checkpoint again on every generation"))
    shared.opts.add_option("mk_give_back_ram", shared.OptionInfo(
        True, "Hand freed RAM back to the system", section=section)
        .info("Windows trims the WebUI's working set, Linux its heap"))


class LobeMemoryKeeperAfterGeneration(scripts.Script):
    """Frees memory once a generation is over, when Settings → Memory Keeper says so."""

    def title(self):
        return "Memory Keeper (Lobe Theme)"

    def show(self, is_img2img):
        return scripts.AlwaysVisible

    def postprocess(self, p, processed, *args):
        if standalone_installed():
            return  # the extension does it; twice would free twice
        try:
            keeper.after_generation()
        except Exception as exc:
            print(f"{TAG} {exc}")


script_callbacks.on_app_started(on_app_started)
script_callbacks.on_ui_settings(on_ui_settings)
