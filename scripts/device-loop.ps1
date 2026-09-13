<#
    Open the USB tunnel so the tablet can load the dev server as `localhost`.

        powershell -ExecutionPolicy Bypass -File scripts\device-loop.ps1

    Run `npm run dev:usb` FIRST (or alongside) -- this script only does the adb half.

    Why `adb reverse` and not Chrome's port forwarding: one command, no Chrome
    dependency, no UI state to get wrong, and it can be scripted. See
    Claude/50_BUILD_DEPLOY/DEVICE_TESTING_USB.md.
#>
[CmdletBinding()]
param(
    [int]$Port = 5173,
    [switch]$Open      # also launch the browser on the device
)

# Find adb: PATH first, then the known unzip location.
$adb = (Get-Command adb -ErrorAction SilentlyContinue).Source
if (-not $adb) {
    $fallback = "$env:USERPROFILE\platform-tools-sdk\platform-tools\adb.exe"
    if (Test-Path $fallback) { $adb = $fallback }
}
if (-not $adb) {
    Write-Host "[device] adb not found. Install Google platform-tools, or add it to PATH." -ForegroundColor Red
    exit 1
}

$state = (& $adb devices) | Select-String -Pattern "\s+(device|unauthorized|offline)$"
if (-not $state) {
    Write-Host "[device] no device attached. Check the cable and USB debugging." -ForegroundColor Red
    exit 1
}
if ($state -match "unauthorized") {
    Write-Host "[device] UNAUTHORIZED -- accept the 'Allow USB debugging?' prompt on the device." -ForegroundColor Yellow
    Write-Host "         If no prompt appears: adb kill-server; adb start-server; adb devices"
    exit 1
}

& $adb reverse "tcp:$Port" "tcp:$Port" | Out-Null

#⛔ Verify rather than assume. `adb reverse` can return 0 and still not be listed.
$listed = (& $adb reverse --list) -match "tcp:$Port"
if (-not $listed) {
    Write-Host "[device] adb reverse did NOT take. Tunnel is not up." -ForegroundColor Red
    exit 1
}
Write-Host "[device] tunnel up: device localhost:$Port -> this PC localhost:$Port" -ForegroundColor Green

# ⚠ The tunnel points at $Port. If Vite fell back to another port because $Port was
# taken, the device reaches the WRONG server and nothing looks wrong. Say so.
$listening = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $listening) {
    Write-Host "[device] WARNING: nothing is listening on $Port yet. Start 'npm run dev:usb'." -ForegroundColor Yellow
    Write-Host "         If Vite says 'Port $Port is in use', an OLD server holds it -- kill that one," -ForegroundColor Yellow
    Write-Host "         or your edits will go to a server the device is not reading." -ForegroundColor Yellow
}

if ($Open) {
    & $adb shell am start -a android.intent.action.VIEW -d "http://localhost:$Port" | Out-Null
    Write-Host "[device] opened http://localhost:$Port on the device."
} else {
    Write-Host "[device] now open http://localhost:$Port on the device."
}
