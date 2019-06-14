let myId = 0;       // This stores the client's id, as retrieved from the server. Each avatar has a unique id.
let avatars = [];   // This data structure stores all the avatars that are currently known, populated with data from the server.

/*-------------------------------------------------------
This function runs when the page first loads. Look for
the line <body onload="pageLoad()"> in the HTML file.
------------------------------------------------------*/
function pageLoad() {

  fetch('/avatar/new', {method: 'post'},    // Do a HTTP POST request to /avatar/new to create a new avatar.
  ).then(response => response.json()
  ).then(data => {
        if (data.hasOwnProperty('error')) {     // Error checking - do an alert box if something went wrong.

          alert(data.error);

        } else {                                   // If nothing went wrong then...

          myId = data.id;                              // Set the client's id variable using the id from the response data.

          setInterval(drawCanvas, 20);         // Set the drawCanvas function to run 50 times per second (once every 20ms)
          setInterval(updateAvatars, 167);     // Set the updateAvatars function to run about 6 times per second (once every 167ms)

          document.addEventListener("keydown", checkKeyPress);     // Set the checkKeyPress function to handle any key press events (for the arrow keys)

          document.getElementById("textToSay").addEventListener("keydown", checkSpeaking);    // The checkSpeaking function will be listening out
                                                                                                             // for when the enter key is pressed to 'speak' some text
          document.getElementById("textToSay").focus();       // Set the input text box to be the focused element of the page straight away (ready to type text)
        }
      }
  );

}

/*-------------------------------------------------------
This function redraws the canvas, creating one 'frame'
of the game's animation. It is called 50 times per second.
------------------------------------------------------*/
function drawCanvas() {

  /* Get a reference the the canvas' drawing context. The context provided
     access to lot of tools that allow us to draw on the canvas. */
  let context = document.getElementById('canvas').getContext('2d');

  context.globalCompositeOperation = 'source-over';     // Enable standard image layering.

  context.clearRect(0, 0, 1024, 768);     // Clear the canvas of all previously drawn stuff.

  for (let a of avatars) {          // Loop through all of the Avatars...

    if (!a.active) continue;        // ... skip them if they're not active

    if (a.lastX !== a.targetX || a.lastY !== a.targetY) {     // If they are moving (haven't reached their target square)...
      a.progress += 0.1;                                      // ... move them 10% closer to their target.
      if (a.progress >= 1) {                                    // If they have reached their target...
        a.lastX = a.targetX;                                    // ... set their last position to be the target,
        a.lastY = a.targetY;
        a.progress = 0;                                         // ... and reset the progress counter.
      }
    }

    let x = (a.lastX + a.progress*(a.targetX - a.lastX))*64;      // Calculate their position!
    let y = (a.lastY + a.progress*(a.targetY - a.lastY))*64;      // Based on the vector equation P_now = P_last + progress*(P_target - P_Last)

    context.save();                                             // The next four lines of code draws the image at the co-ordinates x, y (scaled 50%)
    context.translate(x, y);
    context.drawImage(a.sprite, 0,0, 64, 128, 16, 0, 32, 64);
    context.restore();

    if (a.text !== "") {                                      // If the Avatar is currently speaking...
      context.font = "15px Open Sans";                  // ... set the font and...
      context.fillText(a.text, x + 24, y - 8);    // ... display the text!
    }

  }

}

/*-------------------------------------------------------
This function requests a list of Avatars from the server
and uses it to updates the local list (avatars).
It is called 6 times per second.
------------------------------------------------------*/
function updateAvatars() {

  fetch('/avatar/list', {method: 'get'},      // First, request a list of Avatars from the server
  ).then(response => response.json()           // (HTTP Get request to API Path /avatars/list
  ).then(data => {
        if (data.hasOwnProperty('error')) {           // Handle any errors.
          alert(data.error);
        } else {

          for (let a of avatars) {                       // Assume all the avatars in the local list are not active for now.
            a.active = false;
          }

          for (let d of data) {                          // For all of the avatars in the list send from the server.

            let newAvatar = true;                           // Assume it is a new one unless...
            for (let a of avatars) {
              if (a.id === d.id) {                          // ... we can find it in our local list!
                newAvatar = false;
                if (a.progress === 0) {                     // Only update the target position of avatars that have reached their last target.
                  a.targetX = d.x;
                  a.targetY = d.y;
                }
                a.text = d.text;                            // Set their text and active attributes.
                a.active = true;
                break;                                      // No need to continue this loop if we've found the relevant Avatar.
              }
            }

            if (newAvatar) {                             // If the Avatar has never been seen before (as established by the last loop)...
              let sprite = new Image();                       // Create a new sprite.
              sprite.src = '/client/img/' + d.image;          // Set the sprite's image.
              avatars.push({                                  // Add a new object to the local Avatars list with all the attributes...
                id: d.id,
                lastX: d.x,
                lastY: d.y,
                targetX: d.x,
                targetY: d.y,
                progress: 0,
                sprite: sprite,
                text: d.text,
                active: true
              });
            }

          }
        }
      }
  );

}

/*-------------------------------------------------------
This function processes any key presses and changes the
avatar's target position accordingly.
------------------------------------------------------*/
function checkKeyPress(event) {

  let me;
  for (let a of avatars) {    // First, try and find your Avatar in the local list...
    if (a.id === myId) {      // ... i.e. the one with an id equal to myId...
      me = a;                 // ... Success, found it!
      break;
    }
  }

  // If you've not reached your target square yet you're not allowed to move again.
  if (me === undefined || me.targetX !== me.lastX || me.targetY !== me.lastY) {
    return;
  }

  if ( event.key === "ArrowUp" ) {            // Move up
    if (me.targetY > 0) me.targetY--;         // (assuming you've not reached the top of the play field).
  }

  if ( event.key === "ArrowDown" ) {          // Move down
    if (me.targetY < 768/64-1) me.targetY++;  // (assuming you've not reached the top of the play field).
  }

  if ( event.key === "ArrowLeft" ) {          // Move left
    if (me.targetX > 0) me.targetX--;         // (assuming you've not reached the top of the play field).
  }

  if ( event.key === "ArrowRight" ) {         // Move right
    if (me.targetX < 1024/64-1) me.targetX++; // (assuming you've not reached the top of the play field).
  }

  let formData = new FormData();              // Prepare a new multipart form to send to the server.
  formData.append("id", myId);
  formData.append("x", me.targetX);
  formData.append("y", me.targetY);

  fetch('/avatar/update', {method: 'post', body: formData},     // Send the data! (HTTP Post request).
  ).then(response => response.json()
  ).then(data => {
        if (data.hasOwnProperty('error')) {                           // ... check for any errors.
          alert(data.error);
        }
      }
  );

}

/*-------------------------------------------------------
This function responds to the Enter key being pressed by
sending the text to the server. n.b. It doesn't actually
update the local avatars list, just the server.
------------------------------------------------------*/
function checkSpeaking(event) {

  if ( event.key === "Enter" ) {

    let formData = new FormData();            // Prepare a new multipart form to send to the server.
    formData.append("id", myId);
    formData.append("text", document.getElementById("textToSay").value);

    document.getElementById("textToSay").value = "";            // Clear the text box ready for another message.

    fetch('/avatar/speak', {method: 'post', body: formData},    // Send the data! (HTTP Post request).
    ).then(response => response.json()
    ).then(data => {
          if (data.hasOwnProperty('error')) {                           // ... check for any errors.
            alert(data.error);
          }
        }
    );
  }

}