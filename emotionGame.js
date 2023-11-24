
const startButton = document.getElementById('start-button')
const video = document.getElementById('video')
const homeSite = "index.html"

var canvas = document.getElementById('game');
var context = canvas.getContext('2d');
var running = false;

// the canvas width & height, snake x & y, and the apple x & y, all need to be a multiples of the grid size in order for collision detection to work
// (e.g. 16 * 25 = 400)
var grid = 16;
var count = 0;

var snake = {
  x: 160,
  y: 160,

  // snake velocity. moves one grid length every frame in either the x or y direction
  dx: grid,
  dy: 0,

  // keep track of all grids the snake body occupies
  cells: [],

  // length of the snake. grows when eating an apple
  maxCells: 4
};
var apple = {
  x: 320,
  y: 320
};

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ])

  function startVideo() {
    
    navigator.getUserMedia(
      { video: {} },
      stream => video.srcObject = stream,
      err => console.log(err)
    )
  }

  video.addEventListener('play', () => {

    console.log("hi")
    created =true
  
    setInterval(async () => {
      var detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
      
      detections.forEach(result => {
      const {expressions} = result
      happiness = transformresult(expressions.happy);
      surprised = transformresult(expressions.surprised);
      sad = transformresult(expressions.sad);
      disgusted = transformresult(expressions.disgusted);
      
      performAction(happiness,sad,disgusted,surprised)
  
      
      })
    }, 100)
    
  })

// get random whole numbers in a specific range
// @see https://stackoverflow.com/a/1527820/2124254
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function transformresult(value){
    if (value > 1){
      value = 0
    } else if (value < 0.00001){
      value = 0
    }
    return value
  }
// game loop
function loop() {
    if (running){
    requestAnimationFrame(loop);
    
  

  // slow game loop to 15 fps instead of 60 (60/15 = 4)
  if (++count < 6) {
    return;
  }

  count = 0;
  context.clearRect(0,0,canvas.width,canvas.height);

  // move snake by it's velocity
  snake.x += snake.dx;
  snake.y += snake.dy;

  // wrap snake position horizontally on edge of screen
  if (snake.x < 0) {
    snake.x = canvas.width - grid;
  }
  else if (snake.x >= canvas.width) {
    snake.x = 0;
  }

  // wrap snake position vertically on edge of screen
  if (snake.y < 0) {
    snake.y = canvas.height - grid;
  }
  else if (snake.y >= canvas.height) {
    snake.y = 0;
  }

  // keep track of where snake has been. front of the array is always the head
  snake.cells.unshift({x: snake.x, y: snake.y});

  // remove cells as we move away from them
  if (snake.cells.length > snake.maxCells) {
    snake.cells.pop();
  }

  // draw apple
  context.fillStyle = 'red';
  context.fillRect(apple.x, apple.y, grid-1, grid-1);

  // draw snake one cell at a time
  context.fillStyle = 'green';
  snake.cells.forEach(function(cell, index) {

    // drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
    context.fillRect(cell.x, cell.y, grid-1, grid-1);

    // snake ate apple
    if (cell.x === apple.x && cell.y === apple.y) {
      snake.maxCells++;

      // canvas is 400x400 which is 25x25 grids
      apple.x = getRandomInt(0, 25) * grid;
      apple.y = getRandomInt(0, 25) * grid;
    }

    // check collision with all cells after this one (modified bubble sort)
    for (var i = index + 1; i < snake.cells.length; i++) {

      // snake occupies same space as a body part. reset game
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        lostGame();
      }
      
    }

  });
} 
}

function lostGame() {
    snake.x = 160;
    snake.y = 160;
    snake.cells = [];
    snake.maxCells = 4;
    snake.dx = grid;
    snake.dy = 0;
    apple.x = getRandomInt(0, 25) * grid;
    apple.y = getRandomInt(0, 25) * grid; 
}



function performAction(ha, sa, di, su){
    if (su > 0.8 && snake.dx === 0) {
        snake.dx = -grid;
        snake.dy = 0;
      }
      else if (ha > 0.8 && snake.dy === 0) {
        snake.dy = -grid;
        snake.dx = 0;
      }
      // right arrow key
      else if (di > 0.8 && snake.dx === 0) {
        snake.dx = grid;
        snake.dy = 0;
      }
      // down arrow key
      else if (sa > 0.8 && snake.dy === 0) {
        snake.dy = grid;
        snake.dx = 0;
      }
}


startButton.addEventListener('click', function(){
    if (!running){
        
      running=true;
      startVideo();
      requestAnimationFrame(loop);
      startButton.innerHTML="Stop"
      lostGame()
    } else{
        running = false;
        startButton.innerHTML="Start"
        stopVideo();
  
    }
  }); 

  function stopVideo() {
    let video = document.querySelector('video'); // Holen des Videoelements
    let stream = video.srcObject; // Zugriff auf den Stream
  
    if (stream) {
      let tracks = stream.getTracks(); // Holen der Tracks des Streams
      tracks.forEach(track => track.stop()); // Stoppen aller Tracks
  
      // Leeren des Video-Elements und des Stream-Objekts
      video.srcObject = null;
    }
  }


  // listen to keyboard events to move the snake
document.addEventListener('keydown', function(e) {
    // prevent snake from backtracking on itself by checking that it's 
    // not already moving on the same axis (pressing left while moving
    // left won't do anything, and pressing right while moving left
    // shouldn't let you collide with your own body)
    
    // left arrow key
    if (e.which === 37 && snake.dx === 0) {
      snake.dx = -grid;
      snake.dy = 0;
    }
    // up arrow key
    else if (e.which === 38 && snake.dy === 0) {
      snake.dy = -grid;
      snake.dx = 0;
    }
    // right arrow key
    else if (e.which === 39 && snake.dx === 0) {
      snake.dx = grid;
      snake.dy = 0;
    }
    // down arrow key
    else if (e.which === 40 && snake.dy === 0) {
      snake.dy = grid;
      snake.dx = 0;
    }
  });


  backButton.addEventListener('click', function(){
    if (running){
      stopVideo();
    }
    window.location.href = homeSite;
  
  }); 
