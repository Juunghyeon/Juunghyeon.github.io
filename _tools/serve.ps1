param([int]$Port = 4000, [switch]$Build)
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot
$rubyCommand = Get-Command ruby -ErrorAction SilentlyContinue
if ($rubyCommand) {
  $rubyBin = Split-Path -Parent $rubyCommand.Source
} elseif (Test-Path -LiteralPath 'C:\Ruby33-x64\bin\ruby.exe') {
  $rubyBin = 'C:\Ruby33-x64\bin'
} else {
  throw 'Install Ruby+Devkit with RubyInstaller, then reopen PowerShell.'
}
$env:PATH = "$rubyBin;$env:PATH"
$env:LANG = 'en_US.UTF-8'
$env:JEKYLL_ENV = 'development'
Push-Location -LiteralPath $siteRoot
try {
  # Native gems can fail to compile below a Korean Windows directory name.
  & "$rubyBin\bundle.bat" config set --local path "$env:LOCALAPPDATA\jekyll-bundle"
  if ($LASTEXITCODE -ne 0) { throw 'Could not configure the local gem directory.' }
  & "$rubyBin\bundle.bat" check
  if ($LASTEXITCODE -ne 0) {
    & "$rubyBin\bundle.bat" install
    if ($LASTEXITCODE -ne 0) { throw 'Bundle installation failed.' }
  }
  if ($Build) {
    & "$rubyBin\bundle.bat" exec jekyll build --trace
  } else {
    & "$rubyBin\bundle.bat" exec jekyll serve --host 127.0.0.1 --port $Port --force_polling
  }
  if ($LASTEXITCODE -ne 0) { throw 'Jekyll failed.' }
} finally {
  Pop-Location
}
