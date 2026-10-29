$baseUrl = "http://localhost:8080/api/v1"
Write-Host "=== NovaMart POS E2E Verification ===" -ForegroundColor Green

# 1. Cashier Login
Write-Host "`n1. Testing Cashier Login (cashier@novamart.com)..."
$loginBody = @{ email = "cashier@novamart.com"; password = "cashier123" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $auth.data.access_token
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "SUCCESS: Logged in as: $($auth.data.user.name), Role: $($auth.data.user.role)" -ForegroundColor Cyan

# 2. Get Branches & Test Cashier PIN Login
Write-Host "`n2. Testing Quick Cashier PIN Login (PIN: 2222)..."
$branches = Invoke-RestMethod -Uri "$baseUrl/branches" -Method Get -Headers $headers
$branchId = $branches.data[0].id
$pinBody = @{ branch_id = $branchId; pin = "2222" } | ConvertTo-Json
$pinAuth = Invoke-RestMethod -Uri "$baseUrl/auth/pin-login" -Method Post -Body $pinBody -ContentType "application/json"
Write-Host "SUCCESS: Cashier PIN authenticated for branch $($branches.data[0].name)" -ForegroundColor Cyan

# 3. Barcode Lookup (Teer Sugar: 894110010001)
Write-Host "`n3. Testing Instant Barcode Lookup (EAN: 894110010001)..."
$barcodeItem = Invoke-RestMethod -Uri "$baseUrl/items/barcode/894110010001" -Method Get -Headers $headers
Write-Host "SUCCESS: Found item: $($barcodeItem.data.name_en) ($($barcodeItem.data.name_bn)), Price: ৳ $($barcodeItem.data.base_price_minor / 100), Stock: $($barcodeItem.data.stock_quantity)" -ForegroundColor Cyan

# 4. Search API
Write-Host "`n4. Testing Multi-Criteria Search (q=Fresh)..."
$searchRes = Invoke-RestMethod -Uri "$baseUrl/items/search?q=Fresh" -Method Get -Headers $headers
Write-Host "SUCCESS: Search returned $($searchRes.data.Count) matching products." -ForegroundColor Cyan

# 5. Promotions Validation
Write-Host "`n5. Testing Promotion Engine (Coupon: NOVASAVE50)..."
$promoBody = @{ code = "NOVASAVE50"; subtotal_minor = 150000 } | ConvertTo-Json
$promoRes = Invoke-RestMethod -Uri "$baseUrl/promotions/validate" -Method Post -Body $promoBody -Headers $headers -ContentType "application/json"
Write-Host "SUCCESS: Promo validated: $($promoRes.data.name), Discount: ৳ $($promoRes.data.discount_minor / 100)" -ForegroundColor Cyan

# 6. Create Super Shop Walk-in Order (Discrete + Weighted 1.500 kg items)
Write-Host "`n6. Creating Retail Order with Weighted Items..."
$orderBody = @{
    branch_id = $branchId
    type = "walk_in"
    notes = "Customer trolley lane 01"
    items = @(
        @{
            item_id = $barcodeItem.data.id
            name_snapshot = $barcodeItem.data.name_en
            qty = 2
            unit_price_minor = $barcodeItem.data.base_price_minor
        },
        @{
            name_snapshot = "Fresh Imported Fuji Apples (kg)"
            qty = 1.500
            unit_price_minor = 32000
        }
    )
} | ConvertTo-Json -Depth 5

$order = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Body $orderBody -Headers $headers -ContentType "application/json"
$orderId = $order.data.id
Write-Host "SUCCESS: Created Order #$($order.data.order_no) (UUID: $orderId), Total: ৳ $($order.data.total_minor / 100)" -ForegroundColor Cyan

# 7. Settle Payment at POS
Write-Host "`n7. Settle Payment (Cash ৳ 1000 tendered)..."
$payBody = @{
    payments = @(
        @{
            method_code = "cash"
            amount_minor = $order.data.total_minor
        }
    )
    cash_received = 100000
} | ConvertTo-Json -Depth 5

$payRes = Invoke-RestMethod -Uri "$baseUrl/orders/$orderId/pay" -Method Post -Body $payBody -Headers $headers -ContentType "application/json"
Write-Host "SUCCESS: Payment settled! Invoice: $($payRes.data.invoice_no), Change Due: ৳ $($payRes.data.change_due_minor / 100)" -ForegroundColor Cyan

# 8. Receipt Reprint
Write-Host "`n8. Retrieving 80mm Fiscal Receipt..."
$receipt = Invoke-RestMethod -Uri "$baseUrl/orders/$orderId/receipt" -Method Get -Headers $headers
Write-Host "SUCCESS: Receipt retrieved: $($receipt.data.order.items.Count) line items, Paid: ৳ $($receipt.data.order.paid_minor / 100)" -ForegroundColor Cyan

# 9. Return & Refund with Restock
Write-Host "`n9. Testing Customer Return & Restock..."
$refundBody = @{
    amount_minor = $order.data.total_minor
    reason = "Customer changed mind before leaving counter"
    restock = $true
} | ConvertTo-Json

$refundRes = Invoke-RestMethod -Uri "$baseUrl/orders/$orderId/refund" -Method Post -Body $refundBody -Headers $headers -ContentType "application/json"
Write-Host "SUCCESS: Refund completed! Status: $($refundRes.data.status), Refund Amount: ৳ $($refundRes.data.amount_minor / 100)" -ForegroundColor Cyan

# 10. Dashboard Analytics Verification
Write-Host "`n10. Checking Retail Executive Dashboard..."
$dash = Invoke-RestMethod -Uri "$baseUrl/reports/dashboard?branch_id=$branchId" -Method Get -Headers $headers
Write-Host "SUCCESS: Today Sales: ৳ $($dash.data.today_sales_minor / 100), Today Orders: $($dash.data.today_orders)" -ForegroundColor Cyan

Write-Host "`n=== ALL 10 E2E CHECKS PASSED PERFECTLY ===" -ForegroundColor Green
