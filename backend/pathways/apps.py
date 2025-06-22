import os
import threading
from django.apps import AppConfig

_bootstrap_started = False
_lock = threading.Lock()

class PathwaysConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pathways'

    def ready(self):
        try:
            from django.conf import settings
            global _bootstrap_started

            if settings.DEBUG and os.environ.get("RUN_MAIN") == "true":
                with _lock:
                    if not _bootstrap_started:
                        _bootstrap_started = True
                        from backend.autobootstrap import start_in_background
                        start_in_background()
        except Exception as e:
            print("🚨 Failed to start autobootstrap in DEBUG mode:", e)
