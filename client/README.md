const handleRecording = async () => {
if (!isRecording && !mediaRecorderRef.current) {
// Start recording for the first time
try {
const stream = await navigator.mediaDevices.getUserMedia({
audio: true,
});
streamRef.current = stream; // Store the stream reference
mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        setAudioChunks((prevChunks) => [...prevChunks, e.data]); // Accumulate audio data
      };

      const intervalId = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      mediaRecorderRef.current.intervalId = intervalId;

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
    }

} else if (isRecording && mediaRecorderRef.current.state === "recording") {
// Pause recording
mediaRecorderRef.current.pause();
clearInterval(mediaRecorderRef.current.intervalId);
setIsRecording(false);
} else if (mediaRecorderRef.current.state === "paused") {
// Resume recording
mediaRecorderRef.current.resume();
const intervalId = setInterval(() => {
setRecordingTime((prev) => prev + 1);
}, 1000);
mediaRecorderRef.current.intervalId = intervalId;
setIsRecording(true);
} else if (!isRecording) {
// Stop recording completely
mediaRecorderRef.current.stop();
clearInterval(mediaRecorderRef.current.intervalId);
setAudioDuration(Math.floor(RecordingTime));
mediaRecorderRef.current.onstop = () => {
streamRef.current.getTracks().forEach((track) => track.stop()); // Stop all tracks
mediaRecorderRef.current = null; // Reset the recorder
};
setIsRecording(false);
}
};


















  const handleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true },
        });
        streamRef.current = stream; // Store the stream reference
        mediaRecorderRef.current = new MediaRecorder(stream);
        const intervalId = setInterval(() => {
          setRecordingTime((prev) => prev + 0.2);
        }, 200);
        mediaRecorderRef.current.ondataavailable = (e) => {
          setAudioChunks((prevChunks) => [...prevChunks, e.data]);
          clearInterval(intervalId);
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Microphone access denied", error);
        setIsRecording(false);
      }
    } else {
      mediaRecorderRef.current.stop();
      setAudioDuration(Math.floor(RecordingTime));

      mediaRecorderRef.current.onstop = () => {
        streamRef.current.getTracks().forEach((track) => track.stop()); // Stop all tracks
      };
    }
  };
