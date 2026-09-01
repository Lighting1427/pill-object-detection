$ErrorActionPreference = "Stop"
$FrontendDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $FrontendDirectory
& npm.cmd run dev

