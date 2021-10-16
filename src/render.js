// Electron has a desktop capture module that we can directly access and use
const {  desktopCapturer } = require('electron');
const { dialog, Menu } = require('@electron/remote');
const { writeFile } = require('fs');

// Buttons
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
startBtn.onclick = () => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = () => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// Get available video sources
async function getVideoSources() {
    // The returns value is an array of objects, where each object is a window or screen available on the user's computer that we can record
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map((source) => ({
            label: source.name,
            click: () => selectSource(source)
        }))
    );

    videoOptionsMenu.popup()
}

// Using browser's built-in media recorder (we set the recorder as a global variable and then we set an empty array for the recorded chunks - this will allow us to potentially record video in multiple segments)
let mediaRecorder; // MediaRecorder instance to capture footage
let recordedChunks = [];

// Change the video window to record
async function selectSource(source) {

    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
            }
        }
    };

    // Create a Stream Using the browser's built-in navigator API
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in a video element
    videoElement.srcObject = stream;
    await videoElement.play();

    // Create the media recorder
    const options = { mimeType: 'video/webm; codes=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers (The recorder can be controlled by the user and it has an event based API)
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

// Captures all recorded chunks
function handleDataAvailable(event) {
    console.log('video data available');
    recordedChunks.push(event.data);
}

// Saves the vide file on stop
async function handleStop(event) {
    // Takes all the recorded chunks and convert them into a video file: we do that by creating a blob; a blob is essentially just a data structure to handle raw data (like a video file)
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codes=vp9'
    });

    // What we actually want here is not really a blob but a buffer, which is also an object for representing a raw data
    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await  dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `VID-${Date.now()}.webm`
    });

                console.log(filePath);

// Write the file to the system
   if (filePath) writeFile(filePath, buffer, {}, () => console.log('video saved successfully!') );
   recordedChunks = [];
}
