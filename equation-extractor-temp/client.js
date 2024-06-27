const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let x, y;
let mouseIsPressed = false;
let rect = canvas.getBoundingClientRect();

let currentBoard = [];
let otherUsersCursors = {};

const ws = new WebSocket('ws://localhost:8000/ws');
let loaded = false;

const WIDTH = 1000;
const HEIGHT = 1000;

const cursor = new Image();
cursor.src = './images/cursor.png';
cursor.height = cursor.width * 2; 

let [current_brush_color, current_brush_size] = [1, 3];



/// attach to the pencil-button and eraser-button
let pencil_old_size = current_brush_size;
document.getElementById('pencil-button').addEventListener('click', () => {
    current_brush_color = 1;
    changeBrushSize(pencil_old_size);
});

document.getElementById('eraser-button').addEventListener('click', () => {
    current_brush_color = 0;
    pencil_old_size = current_brush_size;
    changeBrushSize(10);
});

document.getElementById('brush-size').addEventListener('change', (event) => {
    current_brush_size = parseInt(event.target.value);
    pencil_old_size = current_brush_size;
});

function showEquationsFunctionEventCall() {
    console.log('showEquationsFunctionEventCall');
    let equations = findEquationsBounds(currentBoard);
    console.log(equations);
    showEquations(equations, currentBoard);
}



function findEquationsBounds(board) {
    const visited = board.map(row => row.map(() => false));
    let components = [];

    function isValid(x, y) {
        return x >= 0 && x < board.length && y >= 0 && y < board[0].length;
    }

    function dfs(x, y) {
        if (!isValid(x, y) || visited[x][y] || board[x][y] === 0) return null;

        visited[x][y] = true;
        let bounds = { top: x, bottom: x, left: y, right: y };

        let stack = [[x, y]];
        while (stack.length > 0) {
            let [cx, cy] = stack.pop();

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    let nx = cx + dx, ny = cy + dy;
                    if (isValid(nx, ny) && !visited[nx][ny] && board[nx][ny] === 1) {
                        visited[nx][ny] = true;
                        bounds.top = Math.min(bounds.top, nx);
                        bounds.bottom = Math.max(bounds.bottom, nx);
                        bounds.left = Math.min(bounds.left, ny);
                        bounds.right = Math.max(bounds.right, ny);
                        stack.push([nx, ny]);
                    }
                }
            }
        }

        return bounds;
    }

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === 1 && !visited[i][j]) {
                let component = dfs(i, j);
                if (component) {
                    components.push(component);
                }
            }
        }
    }

    // Group components into equations based on horizontal distance
    let equations = [];
    let c = components.sort((a, b) => a.left - b.left);  // Sort components by left bound

    for (let component of c) {
        let added = false;
        for (let equation of equations) {
            // Check if current component is within 100px horizontally from the equation
            if (component.left - equation.bounds.right <= 100) {
                // Extend the equation bounds to include the new component
                equation.bounds.right = Math.max(equation.bounds.right, component.right);
                equation.bounds.top = Math.min(equation.bounds.top, component.top);
                equation.bounds.bottom = Math.max(equation.bounds.bottom, component.bottom);
                equation.values.push(component);
                added = true;
                break;
            }
        }
        if (!added) {
            equations.push({ values: [component], bounds: {...component} });
        }
    }

    return equations;
}


function showEquations(equations, board) {
    const container = document.getElementById('canvasContainer');
    container.innerHTML = ''; // Clear previous canvases

    equations.forEach(eq => {
        // Calculate the dimensions for the canvas based on equation bounds
        const width = (eq.bounds.right - eq.bounds.left + 1) * 10;  // Scale up for visibility
        const height = (eq.bounds.bottom - eq.bounds.top + 1) * 10;
        
        // Create a canvas for each equation
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.scale(10, 10);  // Scale up the drawing

        canvas.style.border = 'solid #0000FF';
        // Draw each number and its bounding box
        eq.values.forEach(num => {
            const numWidth = num.right - num.left + 1;
            const numHeight = num.bottom - num.top + 1;

            // Draw the number from the board
            for (let i = num.top; i <= num.bottom; i++) {
                for (let j = num.left; j <= num.right; j++) {
                    if (board[i][j] === 1) {
                        ctx.fillRect(j - eq.bounds.left, i - eq.bounds.top, 1, 1);  // Draw pixel by pixel
                    }
                }
            }

            // Draw bounding box around the number
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(num.left - eq.bounds.left, num.top - eq.bounds.top, numWidth, numHeight);
        });

        container.appendChild(canvas);
    });
}


function toggleCanvases() {
    const container = document.getElementById('canvasContainer');
    const overlay = document.getElementById('overlay');
    let isDisplayed = container.style.display === 'block';
    container.style.display = isDisplayed ? 'none' : 'block';
    overlay.style.display = isDisplayed ? 'none' : 'block';
}






















function changeBrushSize(size) {
    current_brush_size = size;
    document.getElementById('brush-size').value = size;
}

function draw(x, y) {
    // create circle with size of current_brush_size in the board, and send list to server
    // if size is one, just draw a single pixel
    if (current_brush_size === 1 && isInsideCanvas(x, y)) {
        currentBoard[y][x] = current_brush_color;
        ws.send(JSON.stringify({"type":"pixel-update", "x": x, "y": y, "value": current_brush_color}));
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
        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
            currentBoard[y][x] = current_brush_color;
        }
    }
    

    ws.send(JSON.stringify({"type":"pixels-update", "pixels": circle}));
}

function drawList(pixels) {
    for (let {x, y} of pixels) {
        currentBoard[y][x] = current_brush_color;
    }
    ws.send(JSON.stringify({"type":"pixels-update", "pixels": pixels}));
}

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
    const coords = getNewCoordinates(event);
    const [x, y] = [coords.x, coords.y];

    lastX = x;
    lastY = y;
    draw(x, y);
}


function getNewCoordinates(event){
    return {
        x: Math.floor((event.clientX - rect.left) * (canvas.width / rect.width)),
        y: Math.floor((event.clientY - rect.top) * (canvas.height / rect.height))
    }
}

function isInsideCanvas(x, y) {
    return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
}

let lastX = -1;
let lastY = -1;

lastMousePos = { x: 0, y: 0 };
let locked = false;

function mouseMoveHandler(event) {
    if (mouseIsPressed) {
        const coords = getNewCoordinates(event);
        const [newX, newY] = [coords.x, coords.y];
        if (newX >= 0 && newX < WIDTH && newY >= 0 && newY < HEIGHT) {
            if (lastX !== -1 && lastY !== -1) {
                interpolatePoints(lastX, lastY, newX, newY);
            }

            draw(newX, newY);

            lastX = newX;
            lastY = newY;
        }
    }


    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
    if ((x !== lastMousePos.x || y !== lastMousePos.y) && !locked) {
        ws.send(JSON.stringify({ "type": "cursor-position", "x": x, "y": y }));
        lastMousePos.x = x;
        lastMousePos.y = y;
    }else if(locked && isInsideCanvas(x, y)){
        ws.send(JSON.stringify({ "type": "cursor-position", "x": x, "y": y }));
        locked = false;
    }
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

        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
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

function stopDrawing(){
    mouseIsPressed = false;
    lastX = -1;
    lastY = -1;
}
function stopDrawingLeaveCanvas(event) {
    mouseIsPressed = false;
    lastX = -1;
    lastY = -1;
    ws.send(JSON.stringify({ "type": "cursor-position", "x": -100, "y": -100 }));
    locked = true;
}

ws.onopen = () => {
    console.log('Connected to server');

    canvas.addEventListener('mousedown', mousePressed);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawingLeaveCanvas);
}

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if(data.type === "cursor-position") {
        // add cursor to otherUsersCursors
        if (data.uuid in otherUsersCursors) {
            otherUsersCursors[data.uuid].x = data.x;
            otherUsersCursors[data.uuid].y = data.y;
        } else {
            // pick random color
            color = 'rgb(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ')';
            otherUsersCursors[data.uuid] = { x: data.x, y: data.y, color: color };
        }

        return;
    }
    if(data.type === "client-disconnected") {
        delete otherUsersCursors[data.uuid];
        return;
    }
    if (data.type === "render-new-board") {
        currentBoard = decompress(data.board);

        if (currentBoard.length !== WIDTH || currentBoard[0].length !== HEIGHT) {
            currentBoard = Array.from({ length: WIDTH }, () => Array(HEIGHT).fill(0));
        }
    }
    if (data.type === "pixel-update") {
        if (data.x >= 0 && data.x < WIDTH && data.y >= 0 && data.y < HEIGHT) {
            currentBoard[data.y][data.x] = data.value;
        }
    }
    if (data.type === "pixels-update") {
        for (let { x, y, value } of data.pixels) {
            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                currentBoard[y][x] = value;
            }
        }
    }

}

function animate() {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    rect = canvas.getBoundingClientRect();
    if (currentBoard.length !== 0) {
        for (let i = 0; i < currentBoard.length; i++) {
            for (let j = 0; j < currentBoard[i].length; j++) {
                if (currentBoard[i][j] == 1) {
                    ctx.save();
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(j, i, 1, 0, 2*Math.PI); 
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
    }

    for (let id in otherUsersCursors) {
        ctx.save();
        ctx.fillStyle = otherUsersCursors[id].color;
        ctx.beginPath();
        ctx.drawImage(cursor, otherUsersCursors[id].x, otherUsersCursors[id].y, 15, 20);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText(id.slice(0, 8), otherUsersCursors[id].x-10, otherUsersCursors[id].y + 35);
        ctx.restore();
    }   

    requestAnimationFrame(animate);
}

animate();
