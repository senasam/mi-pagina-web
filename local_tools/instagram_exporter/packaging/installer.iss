#define MyAppName "Felipe Local Tools Agent"
#define MyAppVersion "1.3.0"
#define MyAppExeName "FelipeLocalToolsAgent.exe"

[Setup]
; Se conserva el AppId para actualizar instalaciones anteriores sin duplicarlas.
AppId={{2E84EBE5-A9D6-4B96-9EC8-79E44278E40A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={localappdata}\Programs\FelipeLocalToolsAgent
DefaultGroupName={#MyAppName}
OutputDir=..\installer-output
OutputBaseFilename=FelipeLocalTools-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Tasks]
Name: "autostart"; Description: "Iniciar el agente al entrar en Windows"; GroupDescription: "Inicio automatico:"; Flags: unchecked

[Files]
Source: "..\dist\FelipeLocalToolsAgent\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
#if FileExists("engine-bundle\engine-pack-manifest.json")
Source: "engine-bundle\engine-pack-manifest.json"; DestDir: "{app}"; Flags: ignoreversion
#endif
#if FileExists("engine-bundle\FelipeAudioEnginePack-windows-x64.zip")
Source: "engine-bundle\FelipeAudioEnginePack-windows-x64.zip"; DestDir: "{app}"; Flags: ignoreversion nocompression
#endif

[Icons]
Name: "{group}\Felipe Local Tools Agent"; Filename: "{app}\{#MyAppExeName}"
Name: "{userstartup}\Felipe Local Tools Agent"; Filename: "{app}\{#MyAppExeName}"; Tasks: autostart

[Registry]
Root: HKCU; Subkey: "Software\Classes\felipe-tools"; ValueType: string; ValueName: ""; ValueData: "URL:Felipe Local Tools Agent"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\felipe-tools"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\felipe-tools\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCU; Subkey: "Software\Classes\felipe-tools\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""
; Alias heredado para que la pagina de Instagram siga iniciando el mismo agente.
Root: HKCU; Subkey: "Software\Classes\instagram-agent"; ValueType: string; ValueName: ""; ValueData: "URL:Felipe Local Tools Agent"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\instagram-agent"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\instagram-agent\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCU; Subkey: "Software\Classes\instagram-agent\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "--initialize"; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar Felipe Local Tools Agent"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Los resultados, modelos y sesiones se conservan hasta confirmacion manual.
