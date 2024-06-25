// class Matrix{
//     constructor(rows, cols){
//         this.rows = rows;
//         this.cols = cols;
//         this.data = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
//     }
// }

// class NeuralNetwork{
//     constructor(inputs, outputs){
//         this.inputs = inputs;
//         this.outputs = outputs;
//         this.hiddenLayers = [];
//         this.weights = [];
//         this.biases = [];

//         this.activation = null;
//         this.error = null;
//     }

//     addHiddenLayer(nodes){
//         this.hiddenLayers.push(nodes);
//     }

//     setActivationFunction(func){
//         switch(func){
//             case "relu":
//                 this.activation = function(x){
//                     return Math.max(0, x);
//                 }
//                 break;
//             case "leakyrelu":
//                 this.activation = function(x){
//                     return x < 0 ? 0.01 * x : x;
//                 }
//                 break;
//             default:
//             case "sigmoid":
//                 this.activation = function(x){
//                     return 1 / (1 + Math.exp(-x));
//                 }
//                 break; 
//         }
//     }

//     setLossFunction(func){
//         switch(func){
//             
//         }
//     }


//     predict(input){
//         let inputs = Matrix.
//     }
// }