[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$packageRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent (Split-Path -Parent $packageRoot)
$errors = [System.Collections.Generic.List[string]]::new()
$temporaryEvidenceFiles = [System.Collections.Generic.List[string]]::new()

function Add-ValidationError {
  param([string]$Message)
  $script:errors.Add($Message)
}

function Get-Sha256 {
  param([string]$Path)

  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
      return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '').ToLowerInvariant()
    }
    finally {
      $algorithm.Dispose()
    }
  }
  finally {
    $stream.Dispose()
  }
}

function Export-GitBlobToTempFile {
  param(
    [string]$GitExe,
    [string]$RepositoryRoot,
    [string]$Spec
  )

  $temporaryPath = [System.IO.Path]::GetTempFileName()
  try {
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $GitExe
    $startInfo.Arguments = '-C "' + $RepositoryRoot + '" show "' + $Spec + '"'
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    if (-not $process.Start()) {
      throw 'Git object reader did not start.'
    }

    $destination = [System.IO.File]::Open($temporaryPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try {
      $process.StandardOutput.BaseStream.CopyTo($destination)
    }
    finally {
      $destination.Dispose()
    }

    $null = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) {
      throw 'Git object reader did not return the expected evidence object.'
    }

    $script:temporaryEvidenceFiles.Add($temporaryPath)
    return $temporaryPath
  }
  catch {
    if (Test-Path -LiteralPath $temporaryPath) {
      Remove-Item -LiteralPath $temporaryPath -Force -ErrorAction SilentlyContinue
    }
    throw
  }
}

function Resolve-EvidencePath {
  param(
    [string]$RelativePath,
    [string]$EvidenceCommit
  )

  $workingTreePath = Join-Path $repoRoot $RelativePath
  if (Test-Path -LiteralPath $workingTreePath) {
    return $workingTreePath
  }

  $git = Get-Command git -ErrorAction SilentlyContinue
  if ($null -eq $git) {
    Add-ValidationError("Attempt-6 evidence is missing from the worktree and Git is unavailable for the archived evidence object.")
    return $null
  }

  try {
    return Export-GitBlobToTempFile -GitExe $git.Source -RepositoryRoot $repoRoot -Spec ($EvidenceCommit + ':' + $RelativePath)
  }
  catch {
    Add-ValidationError("Could not read the archived attempt-6 evidence object for $RelativePath.")
    return $null
  }
}

try {
  $requiredFiles = @(
    'README.md',
    'PRODUCT_AND_ARCHITECTURE.md',
    'IMPLEMENTATION_BOUNDARY.md',
    'TEN_PAGE_PROJECT_NARRATIVE.md',
    'DEMO_SCRIPT.md',
    'SCREENSHOT_SHOT_LIST.md',
    'CLAIMS_LEDGER.md',
    'LICENSE_AND_THIRD_PARTY_CHECKLIST.md',
    'JUDGE_CHECKLIST.md',
    'RUNTIME_EVIDENCE_CHECKLIST.md',
    'HANDOFF.md'
  )

  foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $packageRoot $file))) {
      Add-ValidationError("Missing required file: $file")
    }
  }

  $narrativePath = Join-Path $packageRoot 'TEN_PAGE_PROJECT_NARRATIVE.md'
  if (Test-Path -LiteralPath $narrativePath) {
    $pageCount = (Select-String -LiteralPath $narrativePath -Pattern '^## Page [0-9]+ \u2014').Count
    if ($pageCount -ne 10) {
      Add-ValidationError("Ten-page narrative has $pageCount page headings; expected 10.")
    }
  }

  $markdownFiles = @(Get-ChildItem -LiteralPath $packageRoot -File -Recurse -Filter '*.md')
  foreach ($markdownFile in $markdownFiles) {
    $content = Get-Content -LiteralPath $markdownFile.FullName -Raw
    foreach ($match in ([regex]::Matches($content, '\[[^\]]+\]\(([^)]+)\)'))) {
      $target = $match.Groups[1].Value
      if ($target.StartsWith('#') -or $target -match '^[a-zA-Z][a-zA-Z0-9+.-]*:') { continue }
      $relativeTarget = $target.Split('#')[0]
      if ([string]::IsNullOrWhiteSpace($relativeTarget)) { continue }
      if (-not (Test-Path -LiteralPath (Join-Path $markdownFile.DirectoryName $relativeTarget))) {
        Add-ValidationError("Broken local Markdown link in $($markdownFile.Name).")
      }
    }
  }

  $placeholderPattern = '\b(TBD|TBA|coming soon|lorem ipsum)\b'
  foreach ($markdownFile in $markdownFiles) {
    if (Select-String -LiteralPath $markdownFile.FullName -Pattern $placeholderPattern -CaseSensitive:$false -Quiet) {
      Add-ValidationError("Placeholder language found in $($markdownFile.Name).")
    }
  }

  $markdownText = ($markdownFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join "`n"
  $packageFiles = @($markdownFiles) + @(Get-Item -LiteralPath $PSCommandPath)
  $absoluteLocalPathPattern = '(?im)(?<![A-Za-z0-9_])[A-Za-z]:\\|\\\\[A-Za-z0-9._-]+\\'
  $sensitiveValuePattern = '(?i)\b(?:api[_-]?key|secret|token|password|private[ _-]?key)\b\s*(?:=|:)\s*\S+'
  $authorizationValuePattern = '(?i)authorization\s*:\s*(?:bearer|basic)\s+\S+'
  foreach ($packageFile in $packageFiles) {
    $content = Get-Content -LiteralPath $packageFile.FullName -Raw
    if ($content -match $absoluteLocalPathPattern) {
      Add-ValidationError("Absolute local path marker found in $($packageFile.Name).")
    }
    if ($content -match $sensitiveValuePattern -or $content -match $authorizationValuePattern) {
      Add-ValidationError("Sensitive-value marker found in $($packageFile.Name).")
    }
  }

  $readmePath = Join-Path $packageRoot 'README.md'
  if (Test-Path -LiteralPath $readmePath) {
    $readme = Get-Content -LiteralPath $readmePath -Raw
    $requiredHoldPatterns = @(
      '\|\s*Registration/submission\s*\|\s*UNKNOWN-HOLD',
      '\|\s*Receipt/acceptance/approval\s*\|\s*UNKNOWN-HOLD',
      '\|\s*Official score/rank\s*\|\s*UNKNOWN-HOLD',
      '\|\s*Visual verification\s*\|\s*UNKNOWN-HOLD',
      '\|\s*Final submission package/archive hash and redistribution review\s*\|\s*UNKNOWN-HOLD'
    )
    foreach ($pattern in $requiredHoldPatterns) {
      if ($readme -notmatch $pattern) {
        Add-ValidationError('README is missing an independent UNKNOWN-HOLD boundary.')
      }
    }

    $expectedRoutes = @(
      '/',
      '/?mode=fixture',
      '/h2-sentinel?mode=fixture',
      '/h2-sentinel/?mode=fixture',
      '/h2-sentinel?mode=local',
      '/h2-sentinel/?mode=local',
      '/h2-sentinel?mode=invalid',
      '/h2-sentinel/?mode=invalid'
    )
    foreach ($route in $expectedRoutes) {
      if (-not $readme.Contains('`' + $route + '`')) {
        Add-ValidationError('README is missing a verified custom-domain route.')
      }
    }
    if ($readme -notmatch '302 SSO' -or $readme -notmatch 'AUTH-REDIRECT/UNKNOWN-HOLD') {
      Add-ValidationError('README is missing the direct Vercel hostname boundary.')
    }
    if ($readme -notmatch 'It did not contain a literal `invalid-mode` marker') {
      Add-ValidationError('README is missing the corrected invalid-mode marker boundary.')
    }
  }

  if ($markdownText -notmatch [regex]::Escape('https://explorneo.feishu.cn/docx/OwAodS0VxoDUsGxsEFGcRgEtn2f') -or $markdownText -notmatch 'revision 146' -or $markdownText -notmatch 'reviewed 2026-08-23') {
    Add-ValidationError('Organizer-rule source, revision, or review date is missing.')
  }
  if ($markdownText -match '(?im)^\s*(?:final\s+)?(?:organizer\s+)?(?:submission\s+)?(?:package/archive|archive|submission package)\s+SHA-256\s*:') {
    Add-ValidationError('A final archive hash is presented as an artifact identity.')
  }
  if ($markdownText -match '(?i)(?:technical|release)\s+GO\s*(?:\||:|=|-)?\s*GO') {
    Add-ValidationError('Post-document technical status is prematurely marked GO.')
  }
  $legacyLocalZipLabel = 'Desktop' + '/' + 'Downloads'
  if ($markdownText -match [regex]::Escape($legacyLocalZipLabel)) {
    Add-ValidationError('A local organizer ZIP source label remains in the package.')
  }
  $legacyOfficialCsvLabel = 'Official' + ' CSV data | Not included'
  $legacyNoOfficialCsv = 'no official' + ' CSV'
  $legacyReceiptHashWording = 'No receipt tied to' + ' package hash'
  foreach ($legacyAmbiguity in @($legacyOfficialCsvLabel, $legacyNoOfficialCsv, $legacyReceiptHashWording)) {
    if ($markdownText -match [regex]::Escape($legacyAmbiguity)) {
      Add-ValidationError('A superseded CSV or receipt ambiguity remains in the package.')
    }
  }

  $evidenceCommit = '7d925d009802b81c6b14e7cc41f82898206b7a88'
  $reportRelativePath = 'validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/official-csv-e2e.json'
  $csvRelativePath = 'validation/reports/epoch-2/run_f2bc8c0433f8/attempt-6/submission.csv'
  $expectedReportHash = '8796dd1f9e9baca3dad0711c6fb74ccca40485874527a5ef0e2323a9111bf27f'
  $expectedCsvHash = 'af8814d3e428ef1470a43e0a07d4d6dcdc79585846841a15778fff8c91d60326'
  $reportPath = Resolve-EvidencePath -RelativePath $reportRelativePath -EvidenceCommit $evidenceCommit
  $csvPath = Resolve-EvidencePath -RelativePath $csvRelativePath -EvidenceCommit $evidenceCommit

  if ($null -ne $reportPath) {
    if ((Get-Sha256 -Path $reportPath) -ne $expectedReportHash) {
      Add-ValidationError('Attempt-6 report SHA-256 does not match the required identity.')
    }
    try {
      $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
      if ($report.status -ne 'passed' -or [int]$report.attempt -ne 6 -or $report.testedCodeSha -ne '58090bc1747d621bc87d698259319a70c34e75f2') {
        Add-ValidationError('Attempt-6 report status, attempt, or testedCodeSha is invalid.')
      }
      if ([Int64]$report.expected.raw.rows -ne 172800 -or [int]$report.expected.raw.fields -ne 69 -or [Int64]$report.expected.raw.bytes -ne 77865257 -or $report.expected.raw.sha256 -ne '88f3a5c15fb5c42d265475f2998fe9f6c271dcef16f43daee7626f6704504cd9') {
        Add-ValidationError('Attempt-6 raw input identity is invalid.')
      }
      if ([Int64]$report.expected.normalized.rows -ne 172800 -or [int]$report.expected.normalized.fields -ne 69 -or [Int64]$report.expected.normalized.bytes -ne 78038054 -or $report.expected.normalized.sha256 -ne '4407495ad75299f2f8f06112f6d3209eb93b2773ff3f0c797c47874159853169') {
        Add-ValidationError('Attempt-6 normalized input identity is invalid.')
      }

      $importStage = @($report.stages | Where-Object { $_.stage -eq 'import' })[0]
      $analysisStage = @($report.stages | Where-Object { $_.stage -eq 'analysis' })[0]
      $checkerStage = @($report.stages | Where-Object { $_.stage -eq 'checker' })[0]
      $cleanupStage = @($report.stages | Where-Object { $_.stage -eq 'cleanup' })[0]
      if ($null -eq $importStage -or $importStage.status -ne 'passed' -or [Int64]$importStage.rowCount -ne 172800 -or [int]$importStage.fieldCount -ne 69) {
        Add-ValidationError('Attempt-6 import stage does not prove 172800 rows and 69 fields.')
      }
      if ($null -eq $analysisStage -or $analysisStage.status -ne 'passed' -or [int]$analysisStage.eventCount -ne 104) {
        Add-ValidationError('Attempt-6 analysis stage does not prove 104 events.')
      }
      if ($null -eq $checkerStage -or $checkerStage.status -ne 'passed' -or [int]$checkerStage.rowCount -ne 104 -or [int]$checkerStage.columnCount -ne 16) {
        Add-ValidationError('Attempt-6 checker does not prove 104 rows by 16 columns.')
      }
      if ($null -eq $cleanupStage -or $cleanupStage.status -ne 'passed') {
        Add-ValidationError('Attempt-6 cleanup stage is not passed.')
      }
      if ($report.seriesHydration.status -ne 'passed' -or [int]$report.seriesHydration.variableCount -ne 21 -or [Int64]$report.seriesHydration.pointCount -ne 172800) {
        Add-ValidationError('Attempt-6 series hydration identity is invalid.')
      }
      $csvArtifact = @($report.artifacts | Where-Object { $_.ref -eq $csvRelativePath })[0]
      if ($null -eq $csvArtifact -or $csvArtifact.sha256 -ne $expectedCsvHash -or [Int64]$csvArtifact.bytes -ne 168775) {
        Add-ValidationError('Attempt-6 CSV artifact metadata is invalid.')
      }
    }
    catch {
      Add-ValidationError('Attempt-6 report could not be parsed and validated.')
    }
  }

  if ($null -ne $csvPath) {
    if ((Get-Sha256 -Path $csvPath) -ne $expectedCsvHash) {
      Add-ValidationError('Attempt-6 submission.csv SHA-256 does not match the required identity.')
    }
    $expectedHeader = 'pred_event_id,start_time,end_time,anomaly_code,anomaly_subtype,severity,primary_control_object,affected_equipment,confidence,evidence_json,root_cause,recommended_action,primary_impact_metric,estimated_impact_value,first_detection_time,requires_human_confirmation'
    $csvLines = [System.IO.File]::ReadAllLines($csvPath, [System.Text.Encoding]::UTF8)
    if ($csvLines.Length -ne 105) {
      Add-ValidationError('Attempt-6 submission.csv does not have exactly 104 data rows.')
    }
    if ($csvLines.Length -eq 0 -or $csvLines[0] -cne $expectedHeader) {
      Add-ValidationError('Attempt-6 submission.csv header does not match the exact 16-column contract.')
    }
  }
}
catch {
  Add-ValidationError('Validator encountered an unexpected error.')
}
finally {
  foreach ($temporaryPath in $temporaryEvidenceFiles) {
    if (Test-Path -LiteralPath $temporaryPath) {
      Remove-Item -LiteralPath $temporaryPath -Force -ErrorAction SilentlyContinue
    }
  }
}

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Output 'Submission package validation passed: 11 required documents, 10 narrative pages, local links, truthfulness boundaries, and attempt-6 artifact evidence.'
