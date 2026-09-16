Add-Type -AssemblyName System.Speech

function Generate-VoiceMemo($filename, $text, $voiceName) {
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    if ($voiceName) {
        $synth.SelectVoice($voiceName)
    }
    $synth.Rate = 0  # Normal speaking pace
    $synth.Volume = 100
    $outPath = "public/media/$filename"
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($text)
    $synth.Dispose()
    Write-Output "Created realistic voice audio: $outPath"
}

Generate-VoiceMemo "citizen-voice-flood.wav" "Emergency alert from Namkum, Ranchi. The Subarnarekha river embankment has broken near our village. Water is gushing into houses rapidly. We need immediate rescue boats and emergency evacuation team!" "Microsoft Zira Desktop"
Generate-VoiceMemo "citizen-voice-mining.wav" "Attention disaster control room, this is Ramesh from Jharia Dhanbad. Ground cracks are widening across the main road with thick sulfur gas and smoke venting out. Families are in panic, please deploy immediate assistance!" "Microsoft David Desktop"
Generate-VoiceMemo "citizen-voice-water.wav" "SOS voice report from Sahebganj. Our village drinking water wells have turned murky and toxic with high arsenic levels. Many school children have skin rashes and nausea. Please dispatch clean water tankers immediately." "Microsoft Zira Desktop"
Generate-VoiceMemo "citizen-voice-road.wav" "This is citizen reporter Amit from Netarhat road. A massive landslide has washed away half of the bridge approach road. Two ambulances and passenger buses are stranded. Send heavy earthmovers urgently!" "Microsoft David Desktop"
Generate-VoiceMemo "citizen-dispatch.wav" "Emergency alert from ground citizen dispatch. The situation is escalating rapidly and flood water has entered residential buildings. We urgently request district disaster response force and emergency medical teams." "Microsoft Zira Desktop"
