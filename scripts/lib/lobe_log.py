from modules import shared


class LobeLogClass:

    def __init__(self):
        # added a launch argument to enable debug mode @see preload.py
        # just add --lobe-debug to the launch arguments
        self.logging_enabled = getattr(shared.cmd_opts, "lobe_debug", False)

    def debug(self, message: str):
        if self.logging_enabled:
            print(f"[DEBUG] 🤯 Lobe Theme Redux: {message}")

    def info(self, message: str):
        print(f"🤯 Lobe Theme Redux: {message}")

    def error(self, message: str):
        print(f"[ERROR] 🤯 Lobe Theme Redux: {message}")


LobeLog = LobeLogClass()
