param(
  [string]$Action = "status",
  [string]$Target = "all",
  [string]$State = "on"
)

$ErrorActionPreference = 'SilentlyContinue'

try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $null = [Windows.Devices.Radios.Radio, Windows.System.Devices, ContentType = WindowsRuntime]
  $null = [Windows.Devices.Radios.RadioState, Windows.System.Devices, ContentType = WindowsRuntime]
  $null = [Windows.Devices.Radios.RadioKind, Windows.System.Devices, ContentType = WindowsRuntime]
  $null = [Windows.Devices.Radios.RadioAccessStatus, Windows.System.Devices, ContentType = WindowsRuntime]

  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]

  function Await-WinRT($WinRtOp, $ResultType) {
    $netTask = $asTaskGeneric.MakeGenericMethod($ResultType).Invoke($null, @($WinRtOp))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
  }

  $access = Await-WinRT ([Windows.Devices.Radios.Radio]::RequestAccessAsync()) ([Windows.Devices.Radios.RadioAccessStatus])
  $radios = Await-WinRT ([Windows.Devices.Radios.Radio]::GetRadiosAsync()) ([System.Collections.Generic.IReadOnlyList[Windows.Devices.Radios.Radio]])

  if ($Action -eq "set") {
    $desiredState = if ($State -eq "on") { [Windows.Devices.Radios.RadioState]::On } else { [Windows.Devices.Radios.RadioState]::Off }
    foreach ($radio in $radios) {
      $kindStr = $radio.Kind.ToString().ToLower()
      $match = ($Target -eq "all") -or
               ($Target -eq "wifi" -and $kindStr -eq "wifi") -or
               ($Target -eq "bluetooth" -and $kindStr -eq "bluetooth")
      if ($match) {
        $null = Await-WinRT ($radio.SetStateAsync($desiredState)) ([Windows.Devices.Radios.RadioAccessStatus])
      }
    }
    Start-Sleep -Milliseconds 250
    $radios = Await-WinRT ([Windows.Devices.Radios.Radio]::GetRadiosAsync()) ([System.Collections.Generic.IReadOnlyList[Windows.Devices.Radios.Radio]])
  }

  $wifiOn = $false
  $btOn = $false
  foreach ($radio in $radios) {
    $k = $radio.Kind.ToString().ToLower()
    $isOn = ($radio.State.ToString().ToLower() -eq "on")
    if ($k -eq "wifi") { $wifiOn = $isOn }
    if ($k -eq "bluetooth") { $btOn = $isOn }
  }

  [PSCustomObject]@{
    success = $true
    access = $access.ToString()
    wifiOn = $wifiOn
    bluetoothOn = $btOn
  } | ConvertTo-Json -Compress
} catch {
  [PSCustomObject]@{
    success = $false
    error = $_.Exception.Message
  } | ConvertTo-Json -Compress
}
