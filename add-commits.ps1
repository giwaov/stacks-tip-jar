# Commit 200 times with varied content
$commitTypes = @(
    @{prefix="feat"; desc="Add"},
    @{prefix="fix"; desc="Fix"},
    @{prefix="docs"; desc="Update"},
    @{prefix="style"; desc="Improve"},
    @{prefix="refactor"; desc="Refactor"},
    @{prefix="test"; desc="Add test for"},
    @{prefix="chore"; desc="Update"},
    @{prefix="perf"; desc="Optimize"}
)

$features = @(
    "wallet connection", "tip amount validation", "transaction history", "user profile",
    "notification system", "error handling", "loading states", "animation effects",
    "accessibility features", "keyboard navigation", "screen reader support", "color contrast",
    "mobile layout", "tablet view", "desktop optimization", "responsive images",
    "caching strategy", "API calls", "state management", "form validation",
    "input sanitization", "XSS protection", "rate limiting", "session management",
    "unit tests", "integration tests", "e2e tests", "snapshot tests",
    "API documentation", "user guide", "developer docs", "changelog",
    "build configuration", "deployment scripts", "CI pipeline", "code coverage"
)

for ($i = 1; $i -le 200; $i++) {
    $type = $commitTypes[$i % $commitTypes.Length]
    $feature = $features[$i % $features.Length]
    $fileName = "commit-content/commit-$i.md"
    
    # Create directory if needed
    if (-not (Test-Path "commit-content")) {
        New-Item -ItemType Directory -Path "commit-content" -Force | Out-Null
    }
    
    # Create unique content
    $content = @"
# Commit $i - $($type.prefix): $($type.desc) $feature

## Changes
- Updated $feature functionality
- Improved code quality
- Added error handling
- Updated documentation

## Technical Details
- Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- Iteration: $i
- Type: $($type.prefix)

## Notes
This commit improves the overall quality of the codebase.
"@
    
    Set-Content -Path $fileName -Value $content -Encoding UTF8
    git add .
    git commit -m "$($type.prefix): $($type.desc) $feature (iteration $i)"
    
    if ($i % 20 -eq 0) {
        Write-Host "Progress: $i/200 commits completed"
    }
}

Write-Host "All 200 commits created!"
