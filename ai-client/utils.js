function findEquationsBounds(board) {
    let visited = board.map(row => row.map(value => false));
    let equations = [];
    
    function isValid(x, y) {
        return x >= 0 && x < board.length && y >= 0 && y < board[0].length;
    }

    function dfs(x, y, bounds, fromDirection) {
        if (!isValid(x, y) || visited[x][y]) return 0;
        if (board[x][y] === 0) return 1;

        visited[x][y] = true;
        // Update the bounding box with current point
        bounds.top = Math.min(bounds.top, x);
        bounds.bottom = Math.max(bounds.bottom, x);
        bounds.left = Math.min(bounds.left, y);
        bounds.right = Math.max(bounds.right, y);

        // Explore neighbors
        let maxDepth = 1;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(dir => {
            for (let depth = 1; depth <= 30; depth++) {  // check up to 30 pixels distance
                let nx = x + dir[0] * depth, ny = y + dir[1] * depth;
                if (!isValid(nx, ny) || visited[nx][ny] || depth > 10 && board[nx][ny] === 1) break;
                let result = dfs(nx, ny, bounds, dir);
                if (result === 0) break;  // stop if hitting another component or invalid area
                if (board[nx][ny] === 1 && depth <= 30) {
                    // If within inter-character range and finds a 1, treat as part of the same component
                    maxDepth = depth;
                    break;
                }
            }
        });

        return maxDepth <= 10 ? 0 : 1;  // Return 0 if part of the same component, 1 otherwise
    }

    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === 1 && !visited[i][j]) {
                let bounds = { top: i, bottom: i, left: j, right: j };
                dfs(i, j, bounds);
                equations.push([[bounds.top, bounds.left], [bounds.bottom, bounds.right]]);
            }
        }
    }
    
    return equations;
}

// Example usage:
const board = [
    [0, 0, 1, 1, 0, 0, 0, 1, 1],
    [0, 0, 1, 1, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 0]
];
console.log(findEquationsBounds(board));