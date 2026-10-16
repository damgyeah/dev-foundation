# Dot-source in the same process as every copilot command. Never prints the token.
$env:COPILOT_HOME = 'C:\Repos\foundation-scratch\.copilot-home'
$env:COPILOT_CACHE_HOME = 'C:\Repos\foundation-scratch\.copilot-cache'
$env:GH_TOKEN = $null
$env:COPILOT_GITHUB_TOKEN = (gh auth token --hostname github.com)
$env:COPILOT_AUTO_UPDATE = 'false'
$env:PROBE_OUT = 'C:\Repos\foundation-scratch\hook-fired.txt'
function Probe([string]$name, [string]$prompt, [string]$cwd = 'C:\Repos\foundation-scratch', [int]$timeoutSec = 300, [string[]]$extra = @()) {
  $out = "C:\Repos\foundation-scratch\probes\$name.out.txt"; $err = "C:\Repos\foundation-scratch\probes\$name.err.txt"
  New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
  $args2 = @((Join-Path (npm root -g) '@github\copilot\npm-loader.js'), '-p', $prompt, '--allow-all-tools', '--model', 'claude-opus-5.5', '--no-color') + $extra
  $p = Start-Process -FilePath (Get-Command node).Source -ArgumentList ($args2 | % { if ($_ -match '[\s"]') { '"' + ($_ -replace '"','\"') + '"' } else { $_ } }) -WorkingDirectory $cwd -RedirectStandardOutput $out -RedirectStandardError $err -NoNewWindow -PassThru
  if (-not $p.WaitForExit($timeoutSec * 1000)) { Stop-Process -Id $p.Id -Force; "TIMEOUT after $timeoutSec s" | Add-Content $err }
  "=== $name (exit $($p.ExitCode)) ==="; Get-Content $out; '--- stderr ---'; Get-Content $err | Select -Last 15
}