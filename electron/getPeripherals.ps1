# Universal PnP & Bluetooth Connected Peripheral Scanner for Eyeland
$ErrorActionPreference = 'SilentlyContinue'

# 1. Query physically present external peripherals (Wired USB mice, keyboards, webcams, audio interfaces, controllers, flash drives)
$pnp = Get-PnpDevice -Class Mouse, Keyboard, MEDIA, Camera, Image, DiskDrive, USB, HIDClass -Status OK -PresentOnly |
  Where-Object {
    $_.FriendlyName -and
    ($_.InstanceId -notmatch 'ACPI|ROOT|ASUE|BTH|SWD|HDAUDIO|NVME|PCI\\|RZVIRTUAL') -and
    ($_.InstanceId -notmatch 'VID_0B05&PID_1866') -and
    ($_.FriendlyName -notmatch 'Enumerator|Avrcp|Transport|Hands-Free|Adapter|Audio Device|High Definition|ASUS|Realtek|Host Controller|Root Hub|Virtual Audio|Voicemod|THX|Steam|Standard PS/2|PC/AT|Motherboard|NVMe|SATA|System Speaker')
  } | Select-Object FriendlyName, Class, InstanceId

# 2. Query only ACTUALLY connected Bluetooth devices (where DEVPKEY_Device_IsConnected == true)
$bt = Get-PnpDevice -Class Bluetooth -Status OK -PresentOnly |
  Where-Object { $_.InstanceId -match 'DEV_' } |
  ForEach-Object {
    $prop = Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName '{83da6326-97a6-4088-9453-a1923f573b29} 15' -ErrorAction SilentlyContinue
    if ($prop -and $prop.Data -eq $true) {
      [PSCustomObject]@{
        FriendlyName = $_.FriendlyName
        Class = 'Bluetooth'
        InstanceId = $_.InstanceId
      }
    }
  }

$all = @($pnp; $bt) | Where-Object { $_ -and $_.FriendlyName }
if ($all.Count -gt 0) {
  $all | ConvertTo-Json -Compress
} else {
  "[]"
}
