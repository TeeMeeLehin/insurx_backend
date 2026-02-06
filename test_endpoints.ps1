$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "testUser_${timestamp}@test.com"
$password = "password123"
$baseUrl = "http://localhost:4000/api"

Write-Host "1. Registering User ($email)..."
# Escape quotes for JSON in separate variable to avoid shell hell
$regJson = "{`"email`":`"$email`",`"password`":`"$password`",`"fullName`":`"Test User`"}"
# Use curl.exe explicitly
$regOut = curl.exe -s -X POST "$baseUrl/auth/register" -H "Content-Type: application/json" -d $regJson
try {
    $regObj = $regOut | ConvertFrom-Json
    if ($regObj.token) {
        $token = $regObj.token
        Write-Host "Registration Success!" -ForegroundColor Green
    } else {
        throw "No token in response"
    }
} catch {
    Write-Host "Registration Failed. Output: $regOut" -ForegroundColor Red
    
    # Try login
    Write-Host "Trying Login..."
    $loginJson = "{`"email`":`"$email`",`"password`":`"$password`"}"
    $loginOut = curl.exe -s -X POST "$baseUrl/auth/login" -H "Content-Type: application/json" -d $loginJson
    try {
        $loginObj = $loginOut | ConvertFrom-Json
        $token = $loginObj.token
        Write-Host "Login Success!" -ForegroundColor Green
    } catch {
         Write-Host "Login Failed. Output: $loginOut" -ForegroundColor Red
         exit
    }
}

$authHeader = "Authorization: Bearer $token"

Write-Host "`n2. Monitoring Config..."
$monJson = "{`"startArea`":`"Accra`",`"endArea`":`"Kumasi`"}"
$monOut = curl.exe -s -X POST "$baseUrl/monitoring/config" -H "Content-Type: application/json" -H $authHeader -d $monJson
try {
    $monObj = $monOut | ConvertFrom-Json
    Write-Host "Subject: $($monObj.monitoringArea.areaAiSummary)" -ForegroundColor Cyan
} catch {
    Write-Host "Monitoring Config Failed. Output: $monOut" -ForegroundColor Red
}

Write-Host "`n3. Dashboard..."
$dashOut = curl.exe -s -X GET "$baseUrl/monitoring/dashboard" -H $authHeader
try {
    $dashObj = $dashOut | ConvertFrom-Json
    Write-Host "Weather: $($dashObj.climateData.temperature)" -ForegroundColor Cyan
    Write-Host "AI Summary: $($dashObj.climateData.aiAnalysis)" -ForegroundColor Cyan
} catch {
     Write-Host "Dashboard Failed. Output: $dashOut" -ForegroundColor Red
}

Write-Host "`n4. Risk Assessment..."
$riskJson = "{`"location`":`"Lagos`",`"propertyValue`":5000000}"
$riskOut = curl.exe -s -X POST "$baseUrl/risk-assessment" -H "Content-Type: application/json" -H $authHeader -d $riskJson
try {
    $riskObj = $riskOut | ConvertFrom-Json
    Write-Host "Risk Score: $($riskObj.assessment.riskScore)" -ForegroundColor Cyan
    Write-Host "Hazard Score: $($riskObj.assessment.hazardScore)" -ForegroundColor Cyan
} catch {
    Write-Host "Risk Assessment Failed. Output: $riskOut" -ForegroundColor Red
}

Write-Host "`n5. Payment..."
$payJson = "{`"amount`":5000,`"email`":`"$email`"}"
$payOut = curl.exe -s -X POST "$baseUrl/payment/initiate" -H "Content-Type: application/json" -H $authHeader -d $payJson
try {
    $payObj = $payOut | ConvertFrom-Json
    Write-Host "Paystack URL: $($payObj.authorization_url)" -ForegroundColor Cyan
} catch {
    Write-Host "Payment Failed. Output: $payOut" -ForegroundColor Red
}
