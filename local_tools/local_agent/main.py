"""Entrypoint unico y neutral de Felipe Local Tools Agent."""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from local_tools.local_agent.app import create_agent_app
from local_tools.local_agent.config import DEFAULT_PORT, load_or_create_config
from local_tools.local_agent.runtime import AgentPaths


def main() -> int:
    parser = argparse.ArgumentParser(description="Felipe Local Tools Agent")
    parser.add_argument("--port", type=int, default=0)
    parser.add_argument("--show-token", action="store_true")
    parser.add_argument("--initialize", action="store_true")
    parser.add_argument("--organize-worker", action="store_true")
    parser.add_argument("--music-worker", action="store_true")
    parser.add_argument("--model-worker", action="store_true")
    args, worker_args = parser.parse_known_args()

    if args.organize_worker:
        sys.argv = ["organizar_multimedia.py", *worker_args]
        from local_tools.instagram_exporter.organizar_multimedia import main as organizer_main

        return organizer_main()
    if args.music_worker:
        from local_tools.music_analyzer.worker import main as music_worker_main

        return music_worker_main(worker_args)
    if args.model_worker:
        from local_tools.music_analyzer.model_worker import main as model_worker_main

        return model_worker_main(worker_args)

    paths = AgentPaths.create()
    config = load_or_create_config(paths)
    if args.initialize:
        return 0
    if args.show_token:
        print(config["token"])
        return 0
    if getattr(sys, "frozen", False) and os.name == "nt":
        try:
            import ctypes

            console = ctypes.windll.kernel32.GetConsoleWindow()
            if console:
                ctypes.windll.user32.ShowWindow(console, 0)
        except Exception:  # noqa: BLE001
            pass

    port = args.port or int(config.get("port", DEFAULT_PORT))
    if not 1024 <= port <= 65535:
        raise SystemExit("Puerto fuera de rango.")
    import uvicorn

    logging.basicConfig(
        filename=paths.logs / "agent.log",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    uvicorn.run(
        create_agent_app(paths=paths, config=config),
        host="127.0.0.1",
        port=port,
        log_level="info",
        access_log=False,
        log_config=None,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
