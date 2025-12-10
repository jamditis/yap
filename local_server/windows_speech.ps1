# Windows Speech Recognition - Dictation Mode
# Usage: powershell -ExecutionPolicy Bypass -File windows_speech.ps1 [timeout_seconds]
# Returns transcribed text to stdout

param(
    [int]$TimeoutSeconds = 10
)

Add-Type -AssemblyName System.Speech

$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$grammar = New-Object System.Speech.Recognition.DictationGrammar
$recognizer.LoadGrammar($grammar)
$recognizer.SetInputToDefaultAudioDevice()

# Set timeouts
$recognizer.InitialSilenceTimeout = [TimeSpan]::FromSeconds(3)
$recognizer.BabbleTimeout = [TimeSpan]::FromSeconds(2)
$recognizer.EndSilenceTimeout = [TimeSpan]::FromSeconds(1)

try {
    $result = $recognizer.Recognize([TimeSpan]::FromSeconds($TimeoutSeconds))
    if ($result -and $result.Text) {
        Write-Output $result.Text
    }
} catch {
    Write-Error $_.Exception.Message
} finally {
    $recognizer.Dispose()
}
