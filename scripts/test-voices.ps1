Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices()
foreach ($v in $voices) {
    Write-Output $v.VoiceInfo.Name
}
