const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const FormData = require('form-data')
const ocrApiUrl = 'https://api.ocr.space/parse/image';
const apiKey = 'helloworld';

const Dann = require('dannjs');


async function detectEqualSign(buffer) {
    try{
       //send to the neural network
    }catch(e){
        console.error(e);
    }
}
 
function getBuffer(board) {
    const width = 1000;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 1) {
                // fill with black
                ctx.fillStyle = 'black';
                ctx.fillRect(x,y, 1, 1);
            }
        }
    }
    const buffer = canvas.toBuffer('image/jpeg');
    // fs.writeFileSync('./canvas.jpg', buffer)
    return buffer

}
setInterval(() => {
    fetch('http://localhost:8000/get-board')
    .then(response => response.json())
    .then(async data => {
        console.log('updating!')
        const sign = await detectEqualSign(getBuffer(data))
    })
},1000)
