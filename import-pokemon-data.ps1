# Ordnet die Generationsnamen der API deinen Zahlwerten zu.
$generationMap = @{
  "generation-i" = 1
  "generation-ii" = 2
  "generation-iii" = 3
  "generation-iv" = 4
  "generation-v" = 5
  "generation-vi" = 6
  "generation-vii" = 7
  "generation-viii" = 8
  "generation-ix" = 9
}

# Holt aus einer Namensliste den Namen fuer eine bestimmte Sprache.
function Get-LocalizedName {
  param (
    [array]$Names,
    [string]$LanguageCode
  )

  $matchingName = $Names | Where-Object {
    $_.language.name -eq $LanguageCode
  } | Select-Object -First 1

  if ($null -eq $matchingName) {
    return ""
  }

  return $matchingName.name
}

# Holt die Daten eines Pokemon aus der PokeAPI und formt sie fuer dein Projekt um.
function Get-PokemonData {
  param (
    [int]$PokedexNumber
  )

  $url = "https://pokeapi.co/api/v2/pokemon-species/$PokedexNumber"
  $response = Invoke-RestMethod -Uri $url

  $englishName = Get-LocalizedName -Names $response.names -LanguageCode "en"
  $germanName = Get-LocalizedName -Names $response.names -LanguageCode "de"
  $generationName = $response.generation.name
  $generationNumber = $generationMap[$generationName]

  return [pscustomobject]@{
    pokedexNumber = $response.id
    englishName   = $englishName
    germanName    = $germanName
    generation    = $generationNumber
  }
}

# Sammelt alle Pokemon-Daten und schreibt sie als JSON-Datei.
function Export-PokemonDataJson {
  param (
    [string]$JsonPath
  )

  $pokemonList = @()

  for ($number = 1; $number -le 1025; $number++) {
    Write-Host "Lade Pokemon $number von 1025..."
    $pokemonList += Get-PokemonData -PokedexNumber $number
  }

  $json = $pokemonList | ConvertTo-Json -Depth 3
  Set-Content -Path $JsonPath -Value $json -Encoding UTF8
}

$jsonPath = "data/pokemon-data.json"

Export-PokemonDataJson -JsonPath $jsonPath

Write-Host "Import abgeschlossen. pokemon-data.json wurde erstellt."
