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

  let canvasContext = document.getElementById('canvas').getContext('2d');
  canvasContext.globalCompositeOperation = 'source-over';

  canvasContext.clearRect(0, 0, 1024, 768);

  for (let a of avatars) {

    if (!a.active) continue;

    if (a.lastX !== a.targetX || a.lastY !== a.targetY) {
      a.progress += 0.1;
      if (a.progress >= 1) {
        a.lastX = a.targetX;
        a.lastY = a.targetY;
        a.progress = 0;
      }
    }

    let x = (a.lastX + a.progress*(a.targetX - a.lastX))*64;
    let y = (a.lastY + a.progress*(a.targetY - a.lastY))*64;

    canvasContext.save();
    canvasContext.translate(x, y);
    canvasContext.drawImage(a.sprite, 0,0, 64, 128, 16, 0, 32, 64);
    canvasContext.restore();

    if (a.text !== "") {
      canvasContext.font = "15px Open Sans";
      canvasContext.fillText(a.text, x + 24, y - 8);
    }

  }

}

/*-------------------------------------------------------

------------------------------------------------------*/
function updateAvatars() {

  fetch('/avatar/list', {method: 'get'},
  ).then(response => response.json()
  ).then(data => {
        if (data.hasOwnProperty('error')) {
          alert(data.error);
        } else {

          for (let a of avatars) {
            a.active = false;
          }

          for (let d of data) {
            let newAvatar = true;
            for (let a of avatars) {
              if (a.id === d.id) {
                newAvatar = false;
                if (a.progress === 0) {
                  a.targetX = d.x;
                  a.targetY = d.y;
                }
                a.text = d.text;
                a.active = true;
                break;
              }
            }
            if (newAvatar) {
              let sprite = new Image();
              sprite.src = '/client/img/' + d.image;
              avatars.push({
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
  for (let a of avatars) {
    if (a.id === myId) {
      me = a;
      break;
    }
  }

  if (me === undefined || me.targetX !== me.lastX || me.targetY !== me.lastY) {
    return;
  }

  if ( event.key === "ArrowUp" ) {
    if (me.targetY > 0) me.targetY--;
  }

  if ( event.key === "ArrowDown" ) {
    if (me.targetY < 768/64-1) me.targetY++;
  }

  if ( event.key === "ArrowLeft" ) {
    if (me.targetX > 0) me.targetX--;
  }

  if ( event.key === "ArrowRight" ) {
    if (me.targetX < 1024/64-1) me.targetX++;
  }

  let formData = new FormData();
  formData.append("id", myId);
  formData.append("x", me.targetX);
  formData.append("y", me.targetY);

  fetch('/avatar/update', {method: 'post', body: formData},
  ).then(response => response.json()
  ).then(data => {
        if (data.hasOwnProperty('error')) {
          alert(data.error);
        }
      }
  );

}

/*-------------------------------------------------------
------------------------------------------------------*/
function checkSpeaking(event) {

  if ( event.key === "Enter" ) {

    let formData = new FormData();
    formData.append("id", myId);
    formData.append("text", document.getElementById("textToSay").value);
    document.getElementById("textToSay").value = "";

    fetch('/avatar/speak', {method: 'post', body: formData},
    ).then(response => response.json()
    ).then(data => {
          if (data.hasOwnProperty('error')) {
            alert(data.error);
          }
        }
    );
  }

}