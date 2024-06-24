const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let x, y;
let mouseIsPressed = false;
let rect = canvas.getBoundingClientRect();

let currentBoard = [];

const ws = new WebSocket('ws://localhost:8000/ws');
let loaded = false;

function decompress(compressedBoard) {
    const decompressedBoard = [];

    for (let row of compressedBoard) {
        const decompressedRow = [];

        for (let [value, count] of row) {
            for (let i = 0; i < count; i++) {
                decompressedRow.push(value);
            }
        }

        decompressedBoard.push(decompressedRow);
    }

    return decompressedBoard;
}

function mousePressed(event) {
    mouseIsPressed = true;
}

let lastX = -1;
let lastY = -1;

function beginDrawing(event) {
    if (mouseIsPressed) {
        const newX = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
        const newY = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
        
        // Ensure newX and newY are within the canvas bounds
        if (newX >= 0 && newX < 1000 && newY >= 0 && newY < 1000) {
            if (lastX !== -1 && lastY !== -1) {
                interpolatePoints(lastX, lastY, newX, newY);
            }

            ws.send(JSON.stringify({ x: newX, y: newY, value: 1 }));
            currentBoard[newY][newX] = 1; // Note: Ensure y comes first for rows, x for columns

            lastX = newX;
            lastY = newY;
        }
    }
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

        // Ensure x and y are within the canvas bounds
        if (x >= 0 && x < 1000 && y >= 0 && y < 1000) {
            ws.send(JSON.stringify({ x: x, y: y, value: 1 }));
            currentBoard[y][x] = 1; // Note: Ensure y comes first for rows, x for columns
        }
    }
}

function stopDrawing(event) {
    mouseIsPressed = false;
    lastX = -1;
    lastY = -1;
}

ws.onopen = () => {
    console.log('Connected to server');

    canvas.addEventListener('mousedown', mousePressed);
    canvas.addEventListener('mousemove', beginDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (Array.isArray(data)) {
        console.log(data);
        currentBoard = decompress(data);

        if (currentBoard.length !== 1000 || currentBoard[0].length !== 1000) {
            currentBoard = Array.from({ length: 1000 }, () => Array(1000).fill(0));
        }
    } else {
        if (data.x >= 0 && data.x < 1000 && data.y >= 0 && data.y < 1000) {
            currentBoard[data.y][data.x] = data.value;
        }
    }
}

function animate() {
    canvas.width = 1000;
    canvas.height = 1000;
    rect = canvas.getBoundingClientRect();
    if (currentBoard.length !== 0) {
        for (let i = 0; i < currentBoard.length; i++) {
            for (let j = 0; j < currentBoard[i].length; j++) {
                if (currentBoard[i][j] == 1) {
                    ctx.save();
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.rect(j, i, 1, 1); 
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
    }
    requestAnimationFrame(animate);
}

animate();
