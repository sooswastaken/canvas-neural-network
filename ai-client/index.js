const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const FormData = require('form-data')
const ocrApiUrl = 'https://api.ocr.space/parse/image';
const apiKey = 'helloworld';

async function detectEqualSign(buffer) {
    try{
        const formData = new FormData();
        formData.append('file', buffer, {
            filename: 'canvas.jpg',
            contentType: 'image/jpeg'
        })
        formData.append('apikey', apiKey);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'true');
        formData.append('OCREngine', '2');

        const response = await fetch(ocrApiUrl, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders(),
            },
        });
        const jsonResponse = await response.json();

        if(jsonResponse.IsErroredOnProcessing){
            console.error('Error: ', jsonResponse.ErrorMessage);
        }else{
            console.log('OCR Parsed Text: ', jsonResponse.ParsedResults[0].ParsedText);
        }
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
    const buffer = canvas.toBuffer('image/png');
    // fs.writeFileSync('./canvas.png', buffer)
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
