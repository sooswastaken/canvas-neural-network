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

function setupBrain(){
    brain = tf.sequential();
    brain.add(tf.layers.dense({ units: 256, activation: 'relu', inputShape: [1120] }));
    brain.add(tf.layers.dropout({ rate: 0.2 }));
    brain.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    brain.add(tf.layers.dropout({ rate: 0.2 }));
    brain.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    brain.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
    brain.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
}
//try to get network.json
fetch('./network.json')
    .then(response => response.json())
    .then(async data => {
        brain = await tf.loadLayersModel('./network.json');
        await brain.compile({
            optimizer: tf.train.adam(),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
    })
    .catch(err => {
        setupBrain();
    });

// brain = new Dann(1120, 10);
// brain.addHiddenLayer(128, 'sigmoid');
// brain.addHiddenLayer(100, 'sigmoid');
// brain.addHiddenLayer(64, 'sigmoid');
// brain.outputActivation('sigmoid');
// brain.setLossFunction('mce');

// brain.makeWeights();
// fetch('./network.json')
//     .then(response => response.json())
//     .then(data => {
//         brain = Dann.createFromJSON(data);
//         brain.setLossFunction('bce')
//     })
//     .catch(err => {

//     // }
//     });



function get1Dboard(board){
    let array1D = [];
    for (let row of board) {
        array1D.push(...row);
    }
    return array1D;
}

document.getElementById('prediction').addEventListener('click', async() => {
    const inputTensor = tf.tensor2d([get1Dboard(smallBoard)])

    //Predict 10 times, get probability of each number that is not 0, put in an array only the top 2
    let list = [];
    for (let i = 0; i < 10; i++){
        const prediction = brain.predict(inputTensor);
        list.push(prediction.dataSync());
    }
    let sum = list.reduce((acc, val) => acc.map((v, i) => v + val[i]));
    let top2 = [-1, -1];
    let top2index = [-1, -1];
    for (let i = 0; i < sum.length; i++){
        if (sum[i] > top2[0]){
            top2[1] = top2[0];
            top2index[1] = top2index[0];
            top2[0] = sum[i];
            top2index[0] = i;
        }else if (sum[i] > top2[1]){
            top2[1] = sum[i];
            top2index[1] = i;
        }
    }


    document.getElementById('ai-guess').innerHTML = `Guess: ${top2index[0]}`;
    if (top2index[1] > 0.01){
        document.getElementById('ai-guess').innerHTML += ` or ${top2index[1].toString().length}`;
    }

    document.getElementById('ai-confidence').innerHTML = `Confidence: ${(top2[0]*10).toFixed(1)}%`;
    if (top2index[1] > 0.01){
        document.getElementById('ai-confidence').innerHTML += ` or ${(top2[1]*10).toFixed(top2index[1].toString().length)}%`;
    }
});

function rotateBoardRandomly(board) {
    const height = board.length;
    const width = board[0].length;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    const angle = (Math.random() * 20 + 20) * (Math.random() < 0.5 ? 1 : -1);
    const radians = (angle * Math.PI) / 180;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    const newPixels = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (board[y][x] !== 0) {
                const newX = Math.floor((x - centerX) * Math.cos(radians) - (y - centerY) * Math.sin(radians) + centerX);
                const newY = Math.floor((x - centerX) * Math.sin(radians) + (y - centerY) * Math.cos(radians) + centerY);
                newPixels.push({ x: newX, y: newY, value: board[y][x] });

                if (newX < minX) minX = newX;
                if (newY < minY) minY = newY;
                if (newX > maxX) maxX = newX;
                if (newY > maxY) maxY = newY;
            }
        }
    }

    const newWidth = maxX - minX + 1;
    const newHeight = maxY - minY + 1;
    let newBoard = new Array(newHeight).fill(0).map(() => new Array(newWidth).fill(0));

    for (let pixel of newPixels) {
        newBoard[pixel.y - minY][pixel.x - minX] = pixel.value;
    }

    newBoard = resizeBoard(newBoard, 168, 240);

    return newBoard;
}

const correct = document.querySelectorAll('.correct');

correct.forEach((button) => {
    button.addEventListener('click', correctOption)
})

document.getElementById('saveai').addEventListener('click', async () => {
    try {
        const saveResult = await brain.save('downloads://network');
        console.log('Model saved:', saveResult);
    } catch (error) {
        alert('Error saving model:', error);
    }
});
document.getElementById('clearbatch').addEventListener('click', () => {
    batch = [];
});


let batch = []

//batch.push(get1Dboard(smallBoard), correctArray);
document.addEventListener('keypress', (e) => {
    //if the small canvas is empty, do not proceed
    if(smallBoard.every(row => row.every(pixel => pixel == 0)) && e.key != 'l' && e.key != 's' && e.key != "m"){
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
            document.getElementById('saveai').click();
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
        case 'm':
            console.log('done!')
            setupBrain();
            break;
    }
        
})

bcanvas.onmouseup = function(){
    document.getElementById('prediction').click();
}

function getBoundingBox(board) {
    let minX = board[0].length, minY = board.length, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] !== 0) {
                found = true;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!found) {
        return board; // No black pixels found, return the original board
    }

    // Create a new cropped board
    let croppedBoard = [];
    for (let y = minY; y <= maxY; y++) {
        let row = [];
        for (let x = minX; x <= maxX; x++) {
            row.push(board[y][x]);
        }
        croppedBoard.push(row);
    }

    return resizeBoard(croppedBoard, 168, 240);
}

function rotateBoundingBox(board, angle) {
    const radians = (angle * Math.PI) / 180;
    const { minX, minY, maxX, maxY } = getBoundingBox(board);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    let rotatedBoard = new Array(board.length).fill(0).map(() => new Array(board[0].length).fill(0));

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (board[y][x] !== 0) {
                // Calculate new position
                let newX = Math.round((x - centerX) * Math.cos(radians) - (y - centerY) * Math.sin(radians) + centerX);
                let newY = Math.round((x - centerX) * Math.sin(radians) + (y - centerY) * Math.cos(radians) + centerY);

                // Ensure the new position is within bounds
                if (newX >= 0 && newX < board[0].length && newY >= 0 && newY < board.length) {
                    rotatedBoard[newY][newX] = board[y][x];
                }
            }
        }
    }

    return rotatedBoard;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    
}

async function learn(){
    if(batch.length == 0) return;
    shuffle(batch);
    const xs = tf.tensor2d(batch.map(item => item[0]));
    const ys = tf.tensor2d(batch.map(item => item[1]));

    //to stop early

    //indicator
    document.getElementById('ai-guess').innerHTML = "Training...";

    let bestLoss = 100;
    let bestAcc = 0;
    let patience = 20;
    let firstEpochAcc = 0;
    let previousEpoch = {loss: 100, acc: 0}
    let bestBrain;
    //train with da batch
    await brain.fit(xs, ys, {
        epochs: 1000,
        batchSize: 32,
        callbacks: {
            onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
                //get best brain across 500 epochs 
                if (logs.loss < bestLoss) {
                    bestLoss = logs.loss;
                    // patience = 20;

                    if(logs.acc > bestAcc){
                        bestAcc = logs.acc;
                        bestBrain = {brain: brain, loss: logs.loss, acc: logs.acc, epoch: epoch+1};
                        if(logs.acc === 1){
                            //found most accurate network
                            brain.stopTraining = true;
                        }
                    }
                } //else {
                //     patience--;
                // }
                // if (logs.acc === 1 || patience === 0) {
                //   
                //     if (logs.acc <= firstEpochAcc && firstEpochAcc != 1){
                //         patience = 20;
                //     }else{
                //   
                //         if (logs.loss <= previousEpoch.loss && logs.acc >= previousEpoch.acc){
                //             brain.stopTraining = true;
                //         }else{
                //             patience = 2;
                //         }
                //     }
                // }

                previousEpoch = {loss: logs.loss, acc: logs.acc}

            }
        }


    });
    //load the best brain
    if(bestBrain.brain != undefined){
        brain = await cloneModel(bestBrain.brain)
        console.log("got the brain from epoch " + bestBrain.epoch + ", accuracy = " + bestBrain.acc)
    }

    

    document.getElementById('ai-guess').innerHTML = "Training is complete";
    bigBoard = new Array(40*6).fill(0).map(() => new Array(28*6).fill(0));
    batch = [];
}

async function cloneModel(originalModel) {
    const saveHandler = {
        async save(modelArtifacts) {
            return {
                modelArtifactsInfo: {
                    dateSaved: new Date(),
                    modelTopologyType: 'JSON',
                    modelTopologyBytes: modelArtifacts.modelTopology ?
                        new Blob([JSON.stringify(modelArtifacts.modelTopology)]).size :
                        0,
                    weightSpecsBytes: modelArtifacts.weightSpecs ?
                        new Blob([JSON.stringify(modelArtifacts.weightSpecs)]).size :
                        0,
                    weightDataBytes: modelArtifacts.weightData ?
                        modelArtifacts.weightData.byteLength :
                        0,
                },
                modelArtifacts,
            };
        }
    };
    const savedModel = await originalModel.save(saveHandler);

    const clonedModel = await tf.loadLayersModel(tf.io.fromMemory(savedModel.modelArtifacts));

    clonedModel.compile({
        optimizer: originalModel.optimizer, 
        loss: originalModel.loss, 
        metrics: originalModel.metrics
    });

    return clonedModel;
}

function correctOption(key){

    let correctArray = new Array(10).fill(0);
    
    correctArray[key] = 1;

    console.log(correctArray)

    batch.push([get1Dboard(smallBoard), correctArray])
    batch.push([get1Dboard(resizeBoard(rotateBoardRandomly(smallBoard), 28,40)), correctArray])
  

    bigBoard = new Array(40*6).fill(0).map(() => new Array(28*6).fill(0))
}


function compress2DArray(arr){
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

function resizeBoard(board, newWidth, newHeight) {
    let resizedBoard = new Array(newHeight).fill(0).map(() => new Array(newWidth).fill(0));
    let originalHeight = board.length;
    let originalWidth = board[0].length;

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            let origY = Math.floor(y * originalHeight / newHeight);
            let origX = Math.floor(x * originalWidth / newWidth);
            resizedBoard[y][x] = board[origY][origX];
        }
    }

    return resizedBoard;
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

    smallBoard = compress2DArray(getBoundingBox(bigBoard));
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