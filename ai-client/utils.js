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

    // Scan the board and identify all components
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

    // Group components into equations based on proximity
    let equations = [];
    components.sort((a, b) => a.left - b.left);  // Sort components by left bound

    for (let component of components) {
        let added = false;
        for (let equation of equations) {
            // Check proximity vertically and horizontally
            let horizontalClose = component.left - equation.bounds.right <= 75;
            let verticalClose = Math.abs((component.top + component.bottom) / 2 - (equation.bounds.top + equation.bounds.bottom) / 2) <= 75;

            if (horizontalClose && verticalClose) {
                // Merge component into equation
                equation.bounds.right = Math.max(equation.bounds.right, component.right);
                equation.bounds.top = Math.min(equation.bounds.top, component.top);
                equation.bounds.bottom = Math.max(equation.bounds.bottom, component.bottom);
                equation.values.push(component);
                added = true;
                break;
            }
        }
        if (!added) {
            equations.push({ values: [component], bounds: {...component}, hasEqualSign: false});
        }
    }

    // Combine components based on column intersection
    for (let equation of equations) {
        let values = equation.values;
        for (let i = 0; i < values.length; i++) {
            let component1 = values[i];
            for (let j = i + 1; j < values.length; j++) {
                let component2 = values[j];
                // Calculate column overlap
                let overlap = Math.min(component1.right, component2.right) - Math.max(component1.left, component2.left);
                if (overlap >= 15) {
                    equation.hasEqualSign = true;
                    // if the equal sign is the last compoenent in the equation, add equalSignAtEnd: true
                    if(j === values.length - 1) {
                        equation.equalSignAtEnd = true
                    }
                    

                    // Combine the components
                    component1.top = Math.min(component1.top, component2.top);
                    component1.bottom = Math.max(component1.bottom, component2.bottom);
                    component1.left = Math.min(component1.left, component2.left);
                    component1.right = Math.max(component1.right, component2.right);

                    // Remove the merged component and adjust the index
                    values.splice(j, 1);
                    j--;

                    
                }
            }
        }
    }

    return equations;
}


module.exports.findEquationsBounds = findEquationsBounds;