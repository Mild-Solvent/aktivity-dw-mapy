<#
    Snapshot the DNS records that company email depends on.

    The migration to Websupport changes exactly one record --
    aktivity.ceaeurope.sk -- and nothing else in the zone may move. Run this
    before and after that change and diff the two files; any difference outside
    the AKTIVITY section means mail routing or authentication was disturbed and
    the change must be rolled back from the BIND export in .backup/.

        pwsh scripts/dns-email-check.ps1 -OutFile .backup/dns-before.txt
        # ... make the DNS change ...
        pwsh scripts/dns-email-check.ps1 -OutFile .backup/dns-after.txt
        git diff --no-index .backup/dns-before.txt .backup/dns-after.txt

    Output is sorted and normalized so an unchanged zone diffs clean. TTLs are
    deliberately omitted -- they tick down between runs and would produce noise.
#>

param(
    [string]$Domain  = 'ceaeurope.sk',
    [string]$OutFile
)

$ErrorActionPreference = 'Continue'

function Get-Records {
    param([string]$Name, [string]$Type)

    $answers = Resolve-DnsName -Name $Name -Type $Type -ErrorAction SilentlyContinue |
               Where-Object { $_.Type -eq $Type }

    if (-not $answers) { return @("$Name $Type -> (none)") }

    # Bind the record before the switch: PowerShell's switch rebinds $_ to the
    # value being switched on, which would otherwise clobber the pipeline item.
    $answers | ForEach-Object {
        $rec = $_
        $value = switch ($Type) {
            'MX'    { "{0} pref={1}" -f $rec.NameExchange, $rec.Preference }
            'TXT'   { ($rec.Strings -join '') }
            'NS'    { $rec.NameHost }
            'CNAME' { $rec.NameHost }
            'A'     { $rec.IPAddress }
            default { $rec.ToString() }
        }
        "$Name $Type -> $value"
    } | Sort-Object
}

$lines = @()
$lines += "# DNS / email baseline for $Domain"
$lines += "# generated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
$lines += ''

$lines += '## MAIL ROUTING - must never change'
$lines += Get-Records $Domain 'MX'
foreach ($h in 'mailin1','mailin2','mail','smail','smtp','pop3','imap') {
    $lines += Get-Records "$h.$Domain" 'A'
}
$lines += ''

$lines += '## MAIL AUTHENTICATION (SPF / SenderID / verification) - must never change'
$lines += Get-Records $Domain 'TXT'
$lines += Get-Records "_dmarc.$Domain" 'TXT'
$lines += ''

$lines += '## MAIL CLIENT AUTOCONFIG - must never change'
foreach ($h in 'autodiscover','autoconfig') {
    $lines += Get-Records "$h.$Domain" 'CNAME'
}
$lines += ''

$lines += '## ZONE DELEGATION - must never change'
$lines += Get-Records $Domain 'NS'
$lines += ''

$lines += '## OTHER WEB RECORDS - not part of this migration, must never change'
$lines += Get-Records $Domain 'A'
$lines += Get-Records "www.$Domain" 'CNAME'
$lines += ''

$lines += '## AKTIVITY - THE ONLY RECORD THIS MIGRATION CHANGES'
$lines += Get-Records "aktivity.$Domain" 'CNAME'
$lines += Get-Records "aktivity.$Domain" 'A'

$text = $lines -join "`n"

if ($OutFile) {
    $dir = Split-Path -Parent $OutFile
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
    $text | Out-File -FilePath $OutFile -Encoding utf8
    "Wrote $OutFile"
} else {
    $text
}
