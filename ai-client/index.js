const { findEquationsBounds } = require('./utils.js');
const fetch = require('node-fetch'); // Assuming you're using Node.js
const fs = require('fs');
const tensorflow = require('@tensorflow/tfjs');

let numberModel,operatorModel;
(async () => {
    numberModel = await tensorflow.loadLayersModel("file://./network.json");
    
    operatorModel = await tensorflow.loadLayersModel('file://./operatorNetwork.json');
})();

function extractSubArrayFromBounds(bounds, board) {
    const { top, bottom, left, right } = bounds;

    // Calculate the dimensions of the output array
    const height = bottom - top + 1;
    const width = right - left + 1;

    // Initialize the output array
    const subArray = Array.from({ length: height }, () => new Array(width).fill(0));

    // Copy the data from the bounding box into the new array
    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            subArray[y - top][x - left] = board[y][x];
        }
    }

    return subArray;
}

function findBoundingBoxAndResize(imageArray) {
    const height = imageArray.length;
    const width = imageArray[0].length;
    let minX = width, maxX = 0, minY = height, maxY = 0;

    // Find bounding box of non-zero elements
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (imageArray[y][x] !== 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // Determine dimensions of the bounding box
    const boundWidth = maxX - minX + 1;
    const boundHeight = maxY - minY + 1;

    // Determine size of the smallest enclosing square
    const squareSize = Math.max(boundWidth, boundHeight);

    // Center the bounding box content in the square
    const squareArray = Array.from({ length: squareSize }, () =>
        new Array(squareSize).fill(0)
    );

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            squareArray[y - minY + Math.floor((squareSize - boundHeight) / 2)]
                      [x - minX + Math.floor((squareSize - boundWidth) / 2)] = imageArray[y][x];
        }
    }

    // Resize to 28x28
    return resizeImageArray(squareArray, 28, 28);
}

function resizeImageArray(imageArray, newWidth, newHeight) {
    const originalWidth = imageArray[0].length;
    const originalHeight = imageArray.length;
    const scaleX = originalWidth / newWidth;
    const scaleY = originalHeight / newHeight;
    const resizedImageArray = [];

    for (let y = 0; y < newHeight; y++) {
        resizedImageArray[y] = [];
        for (let x = 0; x < newWidth; x++) {
            const px = Math.floor(x * scaleX);
            const py = Math.floor(y * scaleY);
            resizedImageArray[y][x] = imageArray[py][px];
        }
    }

    return resizedImageArray;
}


const already_parsed_equations = [];

async function fetchData() {
    try {
        const response = await fetch('http://localhost:8000/get-board');
        const data = await response.json();
        
        let equations = findEquationsBounds(data)

        for (let i = 0; i < equations.length; i++) {
            const equation = equations[i];
            if(equation.equalSignAtEnd !== true) continue;       
            // if an element from already_parsed_equations is exactly the same as the current equation, then skip it
            if(already_parsed_equations.some(e => e === equation)) continue;
            
            eq = ""

            for(let j = 0; j < equation.values.length ; j++) { 
                const component = equation.values[j];
                let subArray = extractSubArrayFromBounds(component, data);
                subArray = findBoundingBoxAndResize(subArray);
                /// this is a 2d array with the number..! 

                // first check if its an operator since you have a "not operator" option from the nn

                // if its not an operator, then you can try to parse the number
            }

            // for now just eval the equation
            let result = eval(eq);

            // draw it on the board based on the bounds of the equal sign for positioning
            console.log(result);

            
        }
        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData();
