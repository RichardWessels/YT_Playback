// YT_Playback

// Add functionality to click * to refetch video


function logMessage(str) {
    console.log("YTP: " + str);
}

logMessage("HTML 5 Video Playback Control (v1.4.2)");

let video = document.getElementsByTagName("video")[0];

if (!video) {
   interval_variable = setInterval(()=>{run(video)}, 1000); 
}
else run(video);


function run(video) {
    
    logMessage("Running 'run' function...");

    if (!video) {
        logMessage("Video is undefined.");
        video = document.getElementsByTagName("video")[0];
        if (video) {
            logMessage("Video has been retrieved...");
            clearInterval(interval_variable)
        }
        else return;
    }

    logMessage("In main part of code.");
    console.log(video);  // Not using logMessage because object converts to String which isn't useful
    
    // Just some global variables :)
    let currentPlaybackRate = video.playbackRate;
    let previousPlaybackRate = currentPlaybackRate;
    let keyStateDown = 0;
    let fps = 30;  // Doesn't actually have an impact since rewind function deals with time not frames
    let rewindSpeed = 1;
    let intervalVar;
    
    
    function changePlaybackRate(rate) {
        try {
            video.playbackRate = rate;
            previousPlaybackRate = currentPlaybackRate;
            currentPlaybackRate = video.playbackRate;
            logMessage(`Changed speed to ${rate}`);
        }
        catch (err) {
            logMessage(`Error changing playrate, ${err}`);
        }
    }
    
    function rewindPlayback(amount) {
        video.currentTime -= amount;
    }

    
    document.addEventListener("keydown", function(e) {
    
        // Numpad key pressed
        if (e.location === 3) {
    
            // Number key pressed and prevents default event handlers
            if (!Number.isNaN(Number(e.key))) {
                e.preventDefault();
            }
    
            e.preventDefault();  // Keeping both expressions for now, but with use of more characters, this one is preferred
    
            // To prevent re-running code when keys are held down
            if (keyStateDown) {
                return true;
            }
            keyStateDown = 1;
    
            switch (e.key) {
                case "0":
                    // logMessage("zero");
                    changePlaybackRate(1);
                    break;
                case "1":
                    // logMessage("one");
                    changePlaybackRate(0.25);
                    break;
                case "2":
                    // logMessage("two");
                    changePlaybackRate(0.5);
                    break;
                case "3":
                    // logMessage("three");
                    changePlaybackRate(0.75);
                    break;
                case "4":
                    // logMessage("four");
                    changePlaybackRate(1.25);
                    break;
                case "5":
                    // logMessage("five");
                    changePlaybackRate(1.5);
                    break;
                case "6":
                    // logMessage("six");
                    changePlaybackRate(2);
                    break;
                case "7":
                    // logMessage("seven");
                    changePlaybackRate(3);
                    break;
                case "8":
                    // logMessage("eight");
                    changePlaybackRate(4);
                    break;
                case "9":
                    // logMessage("nine");
                    changePlaybackRate(5);
                    break;
                case ".":
                    // logMessage("dot");
                    changePlaybackRate(previousPlaybackRate);
                    e.preventDefault();
                    break;
                case "-":
                    // logMessage("dash");
                    rewindSpeed = currentPlaybackRate;  // Rewind speed proportional to playback rate
                    intervalVar = setInterval(function() {rewindPlayback((2*rewindSpeed)/fps)}, 1000/fps);
                    break;
                default:
                    logMessage("Non-number numpad key pressed...");
            }
        }
    }, true);
    
    // Allows certain keys to only fire while held down, most code similar to 'keydown' event handler
    document.addEventListener("keyup", function(e) {
    
        if (e.location === 3) {
    
            if (!Number.isNaN(Number(e.key))) {
                e.preventDefault();
            }
    
            e.preventDefault();  // Keeping both expressions for now, but with use of more characters, this one is preferred
    
            keyStateDown = 0;
    
            switch (e.key) {
                case "0":
                    break;
                case "1":
                    break;
                case "2":
                    break;
                case "3":
                    break;
                case "4":
                    break;
                case "5":
                    break;
                case "6":
                    break;
                case "7":
                    // logMessage("7 released");
                    changePlaybackRate(previousPlaybackRate);
                    break;
                case "8":
                    // logMessage("8 released");
                    changePlaybackRate(previousPlaybackRate);
                    break;
                case "9":
                    // logMessage("9 released");
                    changePlaybackRate(previousPlaybackRate);
                    break;
                case ".":
                    break;
                case "-":
                    clearInterval(intervalVar);
                    break;
                default:
                    logMessage("Non-number numpad key released...");
            }
        }
    }, true);
}
