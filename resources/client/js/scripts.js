let myId = 0;
let avatars = [];

function pageLoad() {

  fetch('/avatar/new', {method: 'post'},
  ).then(response => response.json()
  ).then(data => {
        if (data.hasOwnProperty('error')) {
          alert(data.error);
        } else {
          myId = data.id;
          setInterval(drawCanvas, 20);
          setInterval(updateAvatars, 150);
          document.addEventListener("keydown", checkKeyPress, false);
          document.getElementById("textToSay").addEventListener("keydown", checkSpeaking, false);

          document.getElementById("textToSay").focus();
        }
      }
  );

}

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

