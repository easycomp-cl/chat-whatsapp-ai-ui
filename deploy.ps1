param(
    [switch]$Staging
)

$envFile = Join-Path $PSScriptRoot ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Error "No se encontró .env.local"
    exit 1
}

$key = if ($Staging) { "VERCEL_DEPLOY_HOOK_URL_STAGING" } else { "VERCEL_DEPLOY_HOOK_URL" }
$hook = $null

Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*$key=(.+)$") {
        $hook = $Matches[1].Trim().Trim('"')
    }
}

if ([string]::IsNullOrWhiteSpace($hook)) {
    $label = if ($Staging) { "staging" } else { "main" }
    Write-Error "Falta $key en .env.local (hook de $label)"
    exit 1
}

$response = Invoke-WebRequest -Uri $hook -Method POST -UseBasicParsing
$target = if ($Staging) { "staging" } else { "main" }

Write-Host "Deploy de $target disparado en Vercel (HTTP $($response.StatusCode))"
Write-Host $response.Content
