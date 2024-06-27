const bcanvas = document.getElementById('trainer-big');
const scanvas = document.getElementById('trainer-small');

const bctx = bcanvas.getContext('2d');
const sctx = scanvas.getContext('2d');

const rect = bcanvas.getBoundingClientRect();

let mouseIsPressed = false;
let lastMousePos = { x: 0, y: 0 };
let lastX = lastY = -1;
let locked = false;
let bigBoard = new Array(40*6).fill(0).map(() => new Array(28*6).fill(0));
let smallBoard = new Array(40).fill(0).map(() => new Array(28).fill(0));

document.getElementById('clear').addEventListener('click', () => {
    bigBoard = new Array(40*6).fill(0).map(() => new Array(28*6).fill(0));
    document.getElementById('ai-guess').innerHTML = "Guess: ";
    document.getElementById('ai-confidence').innerHTML = "Confidence: ";
});


let network = null
let brain = null

let json = null;
fetch('./network.json')
    .then(response => response.json())
    .then(data => {
        brain = new Dann();
        brain.fromJSON(data);
        brain.setLossFunction('bce');
        console.log(brain)
    })
    .catch(err => {
        brain = new Dann(1120, 10);
        brain.addHiddenLayer(64, 'sigmoid');
        brain.addHiddenLayer(64, 'sigmoid');
        brain.outputActivation('sigmoid');
        brain.setLossFunction('bce');

        brain.makeWeights();
        console.log(err)
    // }
    });

if(json == null){
    //check localstorage
    //let network = localStorage.getItem('network');
    // if(network != null){
    //     brain = new Dann();
    //     brain.fromJSON(JSON.parse(network));
    // }else{
        
}else{

}



function get1Dboard(board){
    let oneDimensionalBoard = [];
    let lockedSmallBoard = compress2DArray(bigBoard);
    for(let i = 0; i < board.length; i++){
        for(let j = 0; j < board[i].length; j++){
            oneDimensionalBoard.push(lockedSmallBoard[i][j]);
        }
    }
    return oneDimensionalBoard
}
document.getElementById('prediction').addEventListener('click', () => {
    let oneDimensionalBoard = get1Dboard(smallBoard);

    console.log(oneDimensionalBoard.length)

    const prediction = brain.feedForward(oneDimensionalBoard);
    const maxNumber = Math.max(...prediction);
    let finalNumber;
    for(let i = 0; i < prediction.length; i++){
        if(prediction[i] == maxNumber){
            finalNumber = i;
            break;
        }
    }

    document.getElementById('ai-guess').innerHTML = "Guess: " + finalNumber;
    document.getElementById('ai-confidence').innerHTML = "Confidence: " + maxNumber.toFixed(4);

});

const correct = document.querySelectorAll('.correct');

correct.forEach((button) => {
    button.addEventListener('click', correctOption)
})

document.getElementById('saveai').addEventListener('click', () => {
    saveNetwork(brain, 'network.json');
});
document.getElementById('clearbatch').addEventListener('click', () => {
    batch = [];
});


let batch = []

//batch.push(get1Dboard(smallBoard), correctArray);
document.addEventListener('keypress', (e) => {
    //if the small canvas is empty, do not proceed
    if(smallBoard.every(row => row.every(pixel => pixel == 0)) && e.key != 'l' && e.key != 's'){
        console.log('oops empty')
        return;
    }
    switch(e.key){
        case '0':
            correctOption(0);
            break;
        case '1':
            correctOption(1);
            break;
        case '2':
            correctOption(2);
            break;
        case '3':
            correctOption(3);
            break;
        case '4':
            correctOption(4);
            break;
        case '5':
            correctOption(5);
            break;
        case '6':
            correctOption(6);
            break;
        case '7':
            correctOption(7);
            break;
        case '8':
            correctOption(8);
            break;
        case '9':
            correctOption(9);
            break;
        case 's':
            saveNetwork(brain, 'network.json');
            break;
        case 'l':
            learn();
            break;
        case 'c':
            document.getElementById('clear').click();
            break;
        case 'p':
            document.getElementById('prediction').click();
            break;
    }
        
})

bcanvas.onmouseup = function(){
    document.getElementById('prediction').click();
}

function saveNetwork(network, filename){
    const data = network.toJSON();
    const json = JSON.stringify(data);

    //save to ./filename.json in this repository
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}


function learn(){
    setTimeout(() => {
        for(let i = 0; i < 1000; i++){
            for(let j = 0; j < batch.length; j++){
                brain.backpropagate(batch[j][0], batch[j][1]);
            }
        }
    },10)

    bigBoard = new Array(40*6).fill(0).map(() => new Array(28*6).fill(0));

    localStorage.setItem('network', JSON.stringify(brain.toJSON()));
}

function correctOption(key){
    let correctArray = [0,0,0,0,0,0,0,0,0,0];
    correctArray[key] = 1;

    console.log(correctArray)

    batch.push([get1Dboard(smallBoard), correctArray])
    bigBoard = new Array(40*6).fill(0).map(() => new Array(28*6).fill(0))
}


function compress2DArray(arr){
    //we need to compress to a size of 168x240
    let compressed = [];
    for (let i = 0; i < arr.length; i+=6){
        let row = [];
        for (let j = 0; j < arr[0].length; j+=6){
            let count = 0;
            for (let k = i; k < i+6; k++){
                for (let l = j; l < j+6; l++){
                    count += arr[k][l];
                }
            }
            row.push(count);
        }
        compressed.push(row);
    }
    return compressed;
}

function interpolation (x0, y0, x1, y1){
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let points = [];
    while (true){
        points.push({x: x0, y: y0});
        if ((x0 == x1) && (y0 == y1)) break;
        let e2 = 2*err;
        if (e2 > -dy){
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx){
            err += dx;
            y0 += sy;
        }
    }
    return points;
}

function isInsideCanvas(x, y) {
    return x >= 0 && x < 28*6 && y >= 0 && y < 40*6;
}

bcanvas.addEventListener('mousedown', mousePressed);
bcanvas.addEventListener('mousemove', mouseMoveHandler);
bcanvas.addEventListener('mouseup', stopDrawing);
bcanvas.addEventListener('mouseout', stopDrawingLeaveCanvas);

let current_brush_size = 3;
let current_brush_color = 1;
function draw(x, y) {

    if (current_brush_size === 1 && isInsideCanvas(x, y)) {
        bigBoard[y][x] = current_brush_color;
       return;
    }


    let circle = [];
    for (let i = -current_brush_size; i <= current_brush_size; i++) {
        for (let j = -current_brush_size; j <= current_brush_size; j++) {
            if (Math.sqrt(i * i + j * j) <= current_brush_size && isInsideCanvas(x + i, y + j)) {
                circle.push({"x": x + i, "y": y + j, "value": current_brush_color});
            }
        }
    }

    // update each pixel on the board
    for (let {x, y} of circle) {
        if (x >= 0 && x < 28*6 && y >= 0 && y < 40*6) {
            bigBoard[y][x] = current_brush_color;
        }
    }

}

function mouseMoveHandler(event) {
    if (mouseIsPressed) {
        const [newX, newY] = [event.offsetX, event.offsetY];
        if (newX >= 0 && newX < 28*6 && newY >= 0 && newY < 40*6) {
            if (lastX !== -1 && lastY !== -1) {
                interpolatePoints(lastX, lastY, newX, newY);
            }

            draw(newX, newY)

            lastX = newX;
            lastY = newY;
        }
    }


    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
    if ((x !== lastMousePos.x || y !== lastMousePos.y) && !locked) {
        lastMousePos.x = x;
        lastMousePos.y = y;
    }else if(locked && isInsideCanvas(x, y)){
        locked = false;
    }
}

function mousePressed(event) {
    mouseIsPressed = true;

    draw(event.offsetX, event.offsetY);
    lastX = event.offsetX;
    lastY = event.offsetY;
}




function interpolatePoints(startX, startY, endX, endY) {
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const steps = Math.max(dx, dy);

    if (steps === 0) {
        return;
    }

    let points = [];
    for (let i = 0; i <= steps; i++) {
        const x = Math.round(startX + i * (endX - startX) / steps);
        const y = Math.round(startY + i * (endY - startY) / steps);

        if (x >= 0 && x < 28*6 && y >= 0 && y < 40*6) {
            points.push({x: x, y: y, value: current_brush_color});
           
        }
    }

    // for each point, circle needs to be drawn with size of current_brush_size
    large_list_of_points = []
    for (let point of points) {
        for (let i = -current_brush_size; i <= current_brush_size; i++) {
            for (let j = -current_brush_size; j <= current_brush_size; j++) {
                if (Math.sqrt(i * i + j * j) <= current_brush_size && isInsideCanvas(point.x + i, point.y + j)) {
                    large_list_of_points.push({x: point.x + i, y: point.y + j, value: current_brush_color});
                }
            }
        }
    }
    
    drawList(large_list_of_points);
}

function drawList(pixels) {
    for (let {x, y} of pixels) {
        bigBoard[y][x] = current_brush_color;
    }
}

function stopDrawing(){
    mouseIsPressed = false;
    lastX = -1;
    lastY = -1;
}
function stopDrawingLeaveCanvas(event) {
    mouseIsPressed = false;
    lastX = -1;
    lastY = -1;
    locked = true;
}


function animate(){
    [scanvas.width, scanvas.height, bcanvas.width, bcanvas.height] = [28, 40, 28*6, 40*6];
    bctx.fillStyle = 'black';
    sctx.fillStyle = 'black';

    for (let i = 0; i < bigBoard.length; i++){
        for (let j = 0; j < bigBoard[0].length; j++){
            if (bigBoard[i][j] == 1){
                bctx.fillRect(j, i, 1, 1);
            }
        }
    }

    smallBoard = compress2DArray(bigBoard);
    for (let i = 0; i < smallBoard.length; i++){
        for (let j = 0; j < smallBoard[0].length; j++){
            if (smallBoard[i][j] > 0){
                sctx.fillRect(j, i, 1, 1);
            }
        }
    }

    requestAnimationFrame(animate);
}

animate();