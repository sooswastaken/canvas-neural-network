const bcanvas = document.getElementById('trainer-big');
const scanvas = document.getElementById('trainer-small');

const bctx = bcanvas.getContext('2d');
const sctx = scanvas.getContext('2d');

const rect = bcanvas.getBoundingClientRect();

let mouseIsPressed = false;
let lastMousePos = { x: 0, y: 0 };
let lastX = lastY = -1;
let locked = false;
let bigBoard = new Array(28*6).fill(0).map(() => new Array(40*6).fill(0));
let smallBoard = new Array(28).fill(0).map(() => new Array(40).fill(0));

function getNewCoordinates(event, canvas=bcanvas){
    return {
        x: Math.floor((event.clientX - rect.left) * (canvas.width / rect.width)),
        y: Math.floor((event.clientY - rect.top) * (canvas.height / rect.height))
    }
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



function mouseMoveHandler(event) {
    if (mouseIsPressed) {
        const [newX, newY] = [event.offsetX, event.offsetY];
        if (newX >= 0 && newX < 28*6 && newY >= 0 && newY < 40*6) {
            if (lastX !== -1 && lastY !== -1) {
                interpolatePoints(lastX, lastY, newX, newY);
            }

            bigBoard[newY][newX] = 1;

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
    const coords = getNewCoordinates(event);
    const [x, y] = [coords.x, coords.y];
}





function interpolatePoints(startX, startY, endX, endY) {
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    const steps = Math.max(dx, dy);

    if (steps === 0) {
        return;
    }

    for (let i = 0; i <= steps; i++) {
        const x = Math.round(startX + i * (endX - startX) / steps);
        const y = Math.round(startY + i * (endY - startY) / steps);

        if (x >= 0 && x < 28*6 && y >= 0 && y < 40*6) {
            bigBoard[y][x] = 1; 
        }
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

    for (let i = 0; i < bigBoard.length; i++){
        for (let j = 0; j < bigBoard[0].length; j++){
            if (bigBoard[i][j] == 1){
                bctx.fillStyle = 'black';
                bctx.fillRect(j, i, 1, 1);
            }
        }
    }

    requestAnimationFrame(animate);
}

animate();