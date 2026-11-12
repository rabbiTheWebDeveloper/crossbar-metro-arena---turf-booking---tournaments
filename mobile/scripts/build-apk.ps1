<#
  Builds a signed release APK for the Crossbar Metro Arena mobile app.

  Usage (from the mobile/ folder):
      npm run build:apk
      npm run build:apk -- -Clean          # regenerate the native android project from scratch

  Why the project is mirrored to a short folder first:
  React Native's native (CMake/Ninja) build steps fail on Windows when file paths
  exceed 260 characters, and this repository lives in a long path. The script copies
  the sources to C:\cma (override with -BuildDir), builds there and copies the APK back
  to mobile\release\. It also tells CMake to hash object-file paths longer than
  -CmakeObjectPathMax characters (Expo's default of 1024 assumes Windows long-path
  support, which is off on most machines).

  Signing:
  The first run creates mobile\credentials\release.keystore plus keystore.properties
  (both git-ignored). KEEP A BACKUP of that folder: Android only accepts updates of an
  installed app when they are signed with the same key.
#>
param(
    [string]$BuildDir = 'C:\cma',
    [string]$Abis = 'armeabi-v7a,arm64-v8a',
    # Windows without long-path support: let CMake hash object paths that would exceed this length
    [int]$CmakeObjectPathMax = 240,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'
$ProjectDir = Split-Path -Parent $PSScriptRoot
$CredDir = Join-Path $ProjectDir 'credentials'
$ReleaseDir = Join-Path $ProjectDir 'release'

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# ---------- 0. Tooling ----------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail 'Node.js is not installed.' }
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { Fail 'A JDK (17+) is required: keytool was not found on PATH.' }
if (-not $env:ANDROID_HOME) {
    $guess = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
    if (Test-Path $guess) { $env:ANDROID_HOME = $guess } else { Fail 'ANDROID_HOME is not set and no Android SDK was found.' }
}

# ---------- 1. Signing key ----------
$Keystore = Join-Path $CredDir 'release.keystore'
$KeyProps = Join-Path $CredDir 'keystore.properties'
if (-not (Test-Path $Keystore)) {
    Step 'Creating a release signing key (first run only)'
    New-Item -ItemType Directory -Force $CredDir | Out-Null
    $chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'.ToCharArray()
    $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
    $bytes = New-Object byte[] 28
    $rng.GetBytes($bytes)
    $password = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
    & keytool -genkeypair -v -storetype PKCS12 -keystore $Keystore -alias crossbar -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $password -keypass $password -dname 'CN=Crossbar Metro Arena, OU=Mobile, O=Crossbar Metro Arena, L=Dhaka, C=BD' | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail 'keytool could not create the keystore.' }
    "storePassword=$password`nkeyPassword=$password`nkeyAlias=crossbar`n" | Out-File -FilePath $KeyProps -Encoding ascii
}
$props = @{}
Get-Content $KeyProps | Where-Object { $_ -match '=' } | ForEach-Object { $k, $v = $_ -split '=', 2; $props[$k.Trim()] = $v.Trim() }

# ---------- 2. Mirror sources to the short build folder ----------
Step "Syncing sources to $BuildDir"
New-Item -ItemType Directory -Force $BuildDir | Out-Null
& robocopy $ProjectDir $BuildDir /MIR /NFL /NDL /NJH /NJS /NP /XD node_modules android ios .expo dist release credentials .git | Out-Null
if ($LASTEXITCODE -ge 8) { Fail "robocopy failed with exit code $LASTEXITCODE" }

Push-Location $BuildDir
try {
    # ---------- 3. Dependencies ----------
    $lockHash = (Get-FileHash 'package-lock.json').Hash
    $stamp = 'node_modules\.cma-lock-hash'
    if (-not (Test-Path $stamp) -or (Get-Content $stamp) -ne $lockHash) {
        Step 'Installing npm dependencies'
        if (Test-Path 'node_modules') {
            # Incremental: keeps the compiled native libraries cached inside node_modules
            & npm install --no-audit --no-fund
        } else {
            & npm ci --no-audit --no-fund
        }
        if ($LASTEXITCODE -ne 0) { Fail 'npm install failed.' }
        $lockHash | Out-File -FilePath $stamp -Encoding ascii
    }

    # ---------- 4. Native project ----------
    Step 'Generating the native Android project (expo prebuild)'
    $prebuildArgs = @('expo', 'prebuild', '--platform', 'android', '--no-install')
    if ($Clean) { $prebuildArgs += '--clean' }
    $env:CI = '1'
    & npx @prebuildArgs
    if ($LASTEXITCODE -ne 0) { Fail 'expo prebuild failed.' }

    # ---------- 5. Gradle release build ----------
    Step "Building the release APK ($Abis)"
    $env:NODE_ENV = 'production'
    Push-Location 'android'
    try {
        & .\gradlew.bat app:assembleRelease --console=plain `
            "-PreactNativeArchitectures=$Abis" `
            "-Pexpo.android.cmakeObjectPathMax=$CmakeObjectPathMax" `
            "-Pandroid.injected.signing.store.file=$Keystore" `
            "-Pandroid.injected.signing.store.password=$($props['storePassword'])" `
            "-Pandroid.injected.signing.key.alias=$($props['keyAlias'])" `
            "-Pandroid.injected.signing.key.password=$($props['keyPassword'])"
        if ($LASTEXITCODE -ne 0) { Fail 'Gradle build failed.' }
    } finally { Pop-Location }

    # ---------- 6. Collect the APK ----------
    $apk = Join-Path $BuildDir 'android\app\build\outputs\apk\release\app-release.apk'
    if (-not (Test-Path $apk)) { Fail "APK not found at $apk" }
    $version = (Get-Content 'app.json' -Raw | ConvertFrom-Json).expo.version
    New-Item -ItemType Directory -Force $ReleaseDir | Out-Null
    $target = Join-Path $ReleaseDir "CrossbarMetroArena-v$version.apk"
    Copy-Item $apk $target -Force
    $sizeMb = [math]::Round((Get-Item $target).Length / 1MB, 1)
    Step "Done: $target ($sizeMb MB)"
} finally { Pop-Location }
