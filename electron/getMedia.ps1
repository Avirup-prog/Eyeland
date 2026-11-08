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
        if ($asTaskGeneric) {
            $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
            $netTask = $asTask.Invoke($null, @($WinRtTask))
            $netTask.Wait(800) | Out-Null
            return $netTask.Result
        }
    } catch {}
    return $null
}

try {
    # 1. Primary: Windows GSMTC (Global System Media Transport Controls)
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType = WindowsRuntime] | Out-Null
    $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    if ($mgr) {
        $allSessions = $mgr.GetSessions()
        
        # Prioritize Spotify session if active
        $targetSession = $allSessions | Where-Object { $_.SourceAppUserModelId -match 'Spotify' } | Select-Object -First 1
        
        # If no Spotify session found, check any actively playing session
        if (-not $targetSession) {
            $targetSession = $allSessions | Where-Object { 
                $info = $_.GetPlaybackInfo()
                $info -and ($info.PlaybackStatus.ToString() -eq 'Playing')
            } | Select-Object -First 1
        }
        
        if (-not $targetSession) {
            $targetSession = $mgr.GetCurrentSession()
        }

        if ($targetSession) {
            $props = Await ($targetSession.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
            $info = $targetSession.GetPlaybackInfo()
            $tl = $targetSession.GetTimelineProperties()
            
            $isSpotify = ($targetSession.SourceAppUserModelId -match 'Spotify')
            $statusStr = if ($info) { $info.PlaybackStatus.ToString() } else { 'Closed' }
            $isPlaying = ($statusStr -eq 'Playing')

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
                    } else {
                        [Math]::Max(0, [Math]::Round($tl.Position.TotalSeconds + $elapsed, 1))
                    }
                } else { 0 }

                [PSCustomObject]@{
                    isPlaying = $isPlaying
                    title = $props.Title
                    artist = $props.Artist
                    album = $props.AlbumTitle
                    source = if ($isSpotify) { 'Spotify' } else { $targetSession.SourceAppUserModelId }
                    isNativeSpotify = $isSpotify
                    position = $pos
                    duration = $dur
                } | ConvertTo-Json -Compress
                exit 0
            }
        }
    }

    # 2. Secondary Fallback: Spotify Process Window Title
    $spotProcesses = Get-Process -Name Spotify -ErrorAction SilentlyContinue
    if ($spotProcesses) {
        $playingProc = $spotProcesses | Where-Object { 
            $_.MainWindowTitle -and 
            $_.MainWindowTitle -ne '' -and 
            $_.MainWindowTitle -notmatch '^(Spotify( Free| Premium)?)$' -and 
            $_.MainWindowTitle -match ' - ' 
        } | Select-Object -First 1

        if ($playingProc) {
            $rawTitle = $playingProc.MainWindowTitle
            $splitIdx = $rawTitle.IndexOf(' - ')
            if ($splitIdx -gt 0) {
                $artist = $rawTitle.Substring(0, $splitIdx).Trim()
                $title = $rawTitle.Substring($splitIdx + 3).Trim()
                [PSCustomObject]@{
                    isPlaying = $true
                    title = $title
                    artist = $artist
                    album = ''
                    source = 'Spotify'
                    isNativeSpotify = $true
                    position = $null
                    duration = $null
                } | ConvertTo-Json -Compress
                exit 0
            }
        }
    }
} catch {
    # silent fallback
}

Write-Output '{"isPlaying":false,"status":"no_session","isNativeSpotify":false}'