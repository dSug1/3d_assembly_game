<#
    Opens the Vite dev port to the LAN, as NARROWLY as possible.

    Run from an ADMINISTRATOR PowerShell:
        powershell -ExecutionPolicy Bypass -File scripts\allow-lan-dev.ps1 -PhoneIp 192.168.10.23
    Remove it again when you are done:
        powershell -ExecutionPolicy Bypass -File scripts\allow-lan-dev.ps1 -Remove

    THE SECURITY POSITION, STATED PLAINLY
    -------------------------------------
    A Vite dev server is a DEVELOPMENT tool. It serves your project directory, it has
    no authentication, and its file-serving guards have had real path-traversal CVEs
    (several in 2025 alone). Exposing it to a network means anyone on that network can
    read your source, and a vulnerable version can mean worse.

    That is acceptable on a network where you know every device. It is NOT acceptable
    on a shared, hotel, cafe, coworking or ISP-hotspot network.

    THIS SCRIPT THEREFORE:
      * scopes the rule to ONE port (5173), TCP, inbound only;
      * scopes it to ONE remote address when you pass -PhoneIp -- so only your phone
        can reach it, not the whole subnet;
      * refuses to create a rule on a PUBLIC network profile unless you pass -Force,
        because "Public" is Windows telling you it does not trust the network.
#>
[CmdletBinding()]
param(
    [string]$PhoneIp = "",
    [int]$Port = 5173,
    [switch]$Remove,
    [switch]$Force
)

$RuleName = "Vite dev server (3d_assembly_game)"

if ($Remove) {
    Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue |
        Remove-NetFirewallRule
    Write-Host "[lan] rule removed." -ForegroundColor Green
    exit 0
}

$profileNames = (Get-NetConnectionProfile).NetworkCategory | Select-Object -Unique
if ($profileNames -contains "Public" -and -not $Force) {
    Write-Host ""
    Write-Host "STOP. An active network is classified PUBLIC." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Windows does not trust this network, and neither should you: on a"
    Write-Host "  public network, opening the dev port exposes your source code to"
    Write-Host "  every other device on it."
    Write-Host ""
    Write-Host "  If this is YOUR OWN home router, set it to Private first:"
    Write-Host "    Settings > Network & Internet > Wi-Fi > (your network) > Private"
    Write-Host "  then re-run this script."
    Write-Host ""
    Write-Host "  If it is a shared or hotel network, do NOT use LAN testing."
    Write-Host "  Use the USB route instead -- it exposes nothing. See"
    Write-Host "  Claude/50_BUILD_DEPLOY/INDEX.md."
    Write-Host ""
    exit 1
}

$params = @{
    DisplayName = $RuleName
    Direction   = "Inbound"
    Action      = "Allow"
    Protocol    = "TCP"
    LocalPort   = $Port
    Profile     = "Private"
}
if ($PhoneIp) { $params.RemoteAddress = $PhoneIp }

New-NetFirewallRule @params | Out-Null

Write-Host "[lan] allowed TCP $Port inbound on the Private profile." -ForegroundColor Green
if ($PhoneIp) {
    Write-Host "[lan] restricted to $PhoneIp only." -ForegroundColor Green
} else {
    Write-Host "[lan] WARNING: open to the whole subnet. Pass -PhoneIp to narrow it." -ForegroundColor Yellow
}
Write-Host "[lan] remove it with:  -Remove"
