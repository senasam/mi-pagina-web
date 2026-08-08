#define MyAppName "Instagram Exporter Agent"
#define MyAppVersion "1.0.0"
#define MyAppExeName "InstagramExporterAgent.exe"

[Setup]
AppId={{2E84EBE5-A9D6-4B96-9EC8-79E44278E40A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={localappdata}\Programs\InstagramExporterAgent
DefaultGroupName={#MyAppName}
OutputDir=..\installer-output
OutputBaseFilename=InstagramExporterAgent-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Tasks]
Name: "autostart"; Description: "Iniciar el agente al entrar en Windows"; GroupDescription: "Inicio automatico:"; Flags: unchecked

[Files]
Source: "..\dist\InstagramExporterAgent\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Instagram Exporter Agent"; Filename: "{app}\{#MyAppExeName}"
Name: "{userstartup}\Instagram Exporter Agent"; Filename: "{app}\{#MyAppExeName}"; Tasks: autostart

[Registry]
; Protocolo instagram-agent:// para iniciar el agente desde el navegador.
Root: HKCU; Subkey: "Software\Classes\instagram-agent"; ValueType: string; ValueName: ""; ValueData: "URL:Instagram Exporter Agent"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\instagram-agent"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\instagram-agent\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"
Root: HKCU; Subkey: "Software\Classes\instagram-agent\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "--initialize"; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar Instagram Exporter Agent"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Deliberadamente vacio: las sesiones, claves y exportaciones viven en
; {localappdata}\FelipeMasanes y se conservan hasta confirmacion manual del usuario.
