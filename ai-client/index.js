const { findEquationsBounds } = require('./utils.js');
const mathjs = require('mathjs');

fetch('http://localhost:8000/get-board')
    .then(response => response.json())
    .then(data => {
        console.log(findEquationsBounds(data));
        let expression = "2 + 2";
        let result = mathjs.evaluate(expression);
        console.log(result);
    });

