# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

hiddenimports = collect_submodules("playwright") + ["organizar_multimedia", "cv2", "PIL", "pillow_heif", "pypdf", "num2words", "uvicorn.logging", "uvicorn.loops.auto", "uvicorn.protocols.http.auto", "uvicorn.protocols.websockets.auto", "uvicorn.lifespan.on"]
datas = [
    item for item in collect_data_files("playwright")
    if "chromium_headless_shell" not in item[0].replace("\\", "/")
]

a = Analysis(
    ["../agent.py"],
    pathex=[".."],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[], hooksconfig={}, runtime_hooks=[], excludes=[], noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="InstagramExporterAgent", debug=False, bootloader_ignore_signals=False, strip=False, upx=True, console=True)
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=True, name="InstagramExporterAgent")
