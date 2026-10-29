$baseUrl = "http://localhost:8080/api/v1"
$loginBody = @{ email = "cashier@royalfeast.com"; password = "cashier123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json").data.access_token

$body = @{
    operations = @(
        @{
            id = [guid]::NewGuid().ToString()
            idempotency_key = "IDEMP-TEST-999"
            type = "ping"
            payload = @{ message = "hello" }
        }
    )
} | ConvertTo-Json -Depth 5

$res = Invoke-RestMethod -Uri "$baseUrl/sync/batch" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Sync Result:"
$res | ConvertTo-Json -Depth 5
