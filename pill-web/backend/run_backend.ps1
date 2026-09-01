$ErrorActionPreference = "Stop"
$BackendDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDirectory = Split-Path -Parent (Split-Path -Parent $BackendDirectory)
$PythonExecutable = Join-Path $ProjectDirectory ".venv-web\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $PythonExecutable)) {
    throw "Python environment not found at $PythonExecutable"
}

Set-Location -LiteralPath $BackendDirectory
$env:YOLO_CONFIG_DIR = Join-Path $BackendDirectory ".config"
$env:MPLCONFIGDIR = Join-Path $BackendDirectory ".matplotlib"
$env:PYTHONDONTWRITEBYTECODE = "1"
& $PythonExecutable -B -m uvicorn app.main:app --host 0.0.0.0 --port 8000

