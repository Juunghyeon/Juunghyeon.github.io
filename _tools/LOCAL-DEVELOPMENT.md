# Local Jekyll preview on Windows

Install Ruby+Devkit 3.3 using RubyInstaller (including its MSYS2 toolchain).
Open PowerShell in the repository and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\_tools\serve.ps1
```

Visit http://127.0.0.1:4000. Press Ctrl+C to stop the server.
The script installs missing Gemfile dependencies and uses polling to watch files on Windows.
The initial dependency installation requires internet access.
Gems are stored in `%LOCALAPPDATA%\jekyll-bundle` to avoid native-extension
compilation failures under Korean directory names. Bundler records this locally
in the ignored `.bundle/config` file.

To build without starting the server:

```powershell
powershell -ExecutionPolicy Bypass -File .\_tools\serve.ps1 -Build
```

Use `-Port 4001` if port 4000 is occupied. If Git reports dubious ownership,
run this once from the repository in your normal user terminal:

```powershell
git config --global --add safe.directory "$((Get-Location).Path.Replace('\', '/'))"
```

Ruby installation reference: https://jekyllrb.com/docs/installation/windows/
