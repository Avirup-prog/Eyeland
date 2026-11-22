# Persistent Windows Media Monitor Daemon (High Speed, Zero Process Spawn)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.IsGenericMethodDefinition -and 
    $_.GetParameters().Length -eq 1 
} | Select-Object -First 1

function Await($WinRtTask, $ResultType) {
    if (-not $WinRtTask) { return $null }
    try {
        $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
        $netTask = $asTask.Invoke($null, @($WinRtTask))
        $netTask.Wait(500) | Out-Null
        return $netTask.Result
    } catch { return $null }
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType = WindowsRuntime] | Out-Null
$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

$lastOutputJson = ""
$lastSpotifyProcCheck = 0
$cachedSpotifyProcesses = $null

if (-not $mgr) {
    $lastOutputJson = '{"isPlaying":false,"status":"no_session","isNativeSpotify":false}'
    Write-Output $lastOutputJson
}

# Continuous loop reading media state with intelligent throttling
while ($true) {
    $currentIsPlaying = $false
    try {
        if (-not $mgr) {
            $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
        }

        $allSessions = if ($mgr) { $mgr.GetSessions() } else { $null }
        $targetSession = $null

        if ($allSessions) {
            # 1. Prioritize Spotify session
            $targetSession = $allSessions | Where-Object { $_.SourceAppUserModelId -match 'Spotify' } | Select-Object -First 1
            
            # 2. If Spotify not found, look for any actively playing session
            if (-not $targetSession) {
                $targetSession = $allSessions | Where-Object { 
                    $info = $_.GetPlaybackInfo()
                    $info -and ($info.PlaybackStatus.ToString() -eq 'Playing')
                } | Select-Object -First 1
            }
            
            # 3. Fallback to current session
            if (-not $targetSession) {
                $targetSession = $mgr.GetCurrentSession()
            }
        }

        if ($targetSession) {
            $props = Await ($targetSession.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
            $info = $targetSession.GetPlaybackInfo()
            $tl = $targetSession.GetTimelineProperties()
            
            $isSpotify = ($targetSession.SourceAppUserModelId -match 'Spotify')
            $statusStr = if ($info) { $info.PlaybackStatus.ToString() } else { 'Closed' }
            $isPlaying = ($statusStr -eq 'Playing')
            $currentIsPlaying = $isPlaying

            if ($props -and $props.Title) {
                $dur = if ($tl -and $tl.EndTime.TotalSeconds -gt 0) { [Math]::Round($tl.EndTime.TotalSeconds) } else { 0 }
                $now = [DateTimeOffset]::UtcNow
                
                # Correctly add elapsed time since LastUpdatedTime when actively playing
                $elapsed = if ($tl -and $isPlaying -and $tl.LastUpdatedTime) {
                    [Math]::Max(0, ($now - $tl.LastUpdatedTime).TotalSeconds)
                } else { 0 }

                $pos = if ($tl) {
                    if ($dur -gt 0) {
                        [Math]::Max(0, [Math]::Min($dur, [Math]::Round($tl.Position.TotalSeconds + $elapsed, 1)))
                    } else { 0 }
                } else { 0 }

                $outObj = [PSCustomObject]@{
                    isPlaying = $isPlaying
                    title = $props.Title
                    artist = $props.Artist
                    album = $props.AlbumTitle
                    source = if ($isSpotify) { 'Spotify' } else { $targetSession.SourceAppUserModelId }
                    isNativeSpotify = $isSpotify
                    position = $pos
                    duration = $dur
                } | ConvertTo-Json -Compress

                if ($outObj -ne $lastOutputJson) {
                    $lastOutputJson = $outObj
                    Write-Output $outObj
                }
            } else {
                $idleJson = '{"isPlaying":false,"status":"no_session","isNativeSpotify":false}'
                if ($idleJson -ne $lastOutputJson) {
                    $lastOutputJson = $idleJson
                    Write-Output $idleJson
                }
            }
        } else {
            # Secondary Fallback: Spotify Window Title if GSMTC session closed
            # Throttle Get-Process Spotify check to once every 3 seconds to preserve CPU
            $tick = [Environment]::TickCount
            if (($tick - $lastSpotifyProcCheck) -gt 3000 -or $lastSpotifyProcCheck -eq 0) {
                $lastSpotifyProcCheck = $tick
                $cachedSpotifyProcesses = Get-Process -Name Spotify -ErrorAction SilentlyContinue
            }

            $spotProcesses = $cachedSpotifyProcesses
            $foundProc = $false
            if ($spotProcesses) {
                $playingProc = $spotProcesses | Where-Object { 
                    $_.MainWindowTitle -and 
                    $_.MainWindowTitle -ne '' -and 
                    $_.MainWindowTitle -notmatch '^(Spotify( Free| Premium)?)$' -and 
                    $_.MainWindowTitle -match ' - ' 
                } | Select-Object -First 1

                if ($playingProc) {
                    $foundProc = $true
                    $rawTitle = $playingProc.MainWindowTitle
                    $splitIdx = $rawTitle.IndexOf(' - ')
                    if ($splitIdx -gt 0) {
                        $artist = $rawTitle.Substring(0, $splitIdx).Trim()
                        $title = $rawTitle.Substring($splitIdx + 3).Trim()
                        $currentIsPlaying = $true
                        $outObj = [PSCustomObject]@{
                            isPlaying = $true
                            title = $title
                            artist = $artist
                            album = ''
                            source = 'Spotify'
                            isNativeSpotify = $true
                            position = $null
                            duration = $null
                        } | ConvertTo-Json -Compress

                        if ($outObj -ne $lastOutputJson) {
                            $lastOutputJson = $outObj
                            Write-Output $outObj
                        }
                    }
                }
            }
            if (-not $foundProc) {
                $idleJson = '{"isPlaying":false,"status":"no_session","isNativeSpotify":false}'
                if ($idleJson -ne $lastOutputJson) {
                    $lastOutputJson = $idleJson
                    Write-Output $idleJson
                }
            }
        }
    } catch {
        $idleJson = '{"isPlaying":false,"status":"no_session","isNativeSpotify":false}'
        if ($idleJson -ne $lastOutputJson) {
            $lastOutputJson = $idleJson
            Write-Output $idleJson
        }
    }

    # High performance dynamic sleep: 400ms when actively playing, 1000ms when idle
    if ($currentIsPlaying) {
        Start-Sleep -Milliseconds 400
    } else {
        Start-Sleep -Milliseconds 1000
    }
}
