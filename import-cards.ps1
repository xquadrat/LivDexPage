# Macht aus null einen leeren String und entfernt Leerzeichen am Rand.
function Get-SafeText {
  param (
    $Value
  )

  if ($null -eq $Value) {
    return ""
  }

  return "$Value".Trim()
}

# Formatiert Kartennummern fuer die JSON-Datei.
# Reine Zahlen werden auf drei Stellen mit Nullen aufgefuellt.
function Format-CardNumber {
  param (
    [string]$CardNumber
  )

  $safeCardNumber = Get-SafeText $CardNumber

  if ($safeCardNumber -match '^\d+$') {
    return $safeCardNumber.PadLeft(3, "0")
  }

  return $safeCardNumber
}

# Liest eine CSV-Zeile und wandelt sie in das Kartenformat der Website um.
function Convert-RowToCard {
  param (
    [pscustomobject]$Row
  )

  $cardName = Get-SafeText $Row.cardName
  $isOwned = $cardName -ne ""

  $language = Get-SafeText $Row.language

  if ($isOwned -and $language -eq "") {
    $language = "Deutsch"
  }

  return [pscustomobject]@{
    pokedexNumber    = [int]$Row.pokedexNumber
    pokemonName      = Get-SafeText $Row.pokemonName
    cardName         = $cardName
    setExtra         = Get-SafeText $Row.setExtra
    set              = Get-SafeText $Row.set
    cardNumber       = Format-CardNumber $Row.cardNumber
    language         = $language
    note             = Get-SafeText $Row.note
    isOwned          = $isOwned
    foilType         = ""
    targetCardSet    = ""
    targetCardNumber = ""
  }
}

# Liest die CSV-Datei mit UTF-8 ein und gibt die Kartenliste zurueck.
function Import-CardsFromCsv {
  param (
    [string]$CsvPath
  )

  $csvContent = Get-Content -Path $CsvPath -Encoding UTF8
  $rows = $csvContent | ConvertFrom-Csv

  return $rows | ForEach-Object {
    Convert-RowToCard -Row $_
  }
}

# Schreibt die Kartenliste als JSON-Datei in den data-Ordner.
function Export-CardsToJson {
  param (
    [object[]]$Cards,
    [string]$JsonPath
  )

  $json = $Cards | ConvertTo-Json -Depth 3
  Set-Content -Path $JsonPath -Value $json -Encoding UTF8
}

$csvPath = "Living Dex - Ordner1.csv"
$jsonPath = "data/cards.json"

$cards = Import-CardsFromCsv -CsvPath $csvPath
Export-CardsToJson -Cards $cards -JsonPath $jsonPath

Write-Host "Import abgeschlossen. $($cards.Count) Karten wurden nach $jsonPath exportiert."