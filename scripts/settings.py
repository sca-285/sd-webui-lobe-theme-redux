from fastapi import FastAPI

import modules.scripts as scripts
import os
from typing import Any

from modules import shared
from modules import script_callbacks

from scripts.lib.lobe_log import LobeLog
from scripts.lib.api import LobeApi
from scripts.lib.config import LobeConfig
from scripts.lib.package import LobePackage
from scripts.lib.prompt import LobePrompt
from scripts.lib.locale import LobeLocale

def remove_stale_bundle():
    """Delete build files of other versions that are still next to this one.

    The WebUI loads every .js and .mjs file directly in javascript/. This
    version is javascript/main.js (a small loader) plus javascript/chunks/.
    `git pull` removes old files, but copying a release over an older folder
    does not, and a left-over loader or bundle would start the theme twice:
    - main.mjs: the loader of earlier builds of this version;
    - giscus-*.js: part of the single-file bundle of upstream 3.5.x (whose
      main.js is replaced by this version's).
    """
    js_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "javascript")
    main = os.path.join(js_dir, "main.js")
    try:
        with open(main, "r", encoding="utf-8") as f:
            if "__LOBE_THEME_ENTRY__" not in f.read(4096):
                return  # not this version's loader: leave everything alone
    except OSError:
        return
    for name in os.listdir(js_dir):
        if name == "main.mjs" or (name.startswith("giscus-") and name.endswith(".js")):
            try:
                os.remove(os.path.join(js_dir, name))
                LobeLog.info(f"removed stale build file javascript/{name}")
            except OSError as e:
                LobeLog.error(f"could not remove stale javascript/{name}: {e}")


remove_stale_bundle()


def init_lobe(_: Any, app: FastAPI, **kwargs):
    LobeLog.info("Initializing...")

    package = LobePackage()
    prompt = LobePrompt()
    locale = LobeLocale()
    config = LobeConfig()
    api = LobeApi(config, package, prompt, locale)
    api.create_api_route(app)



script_callbacks.on_app_started(init_lobe)
