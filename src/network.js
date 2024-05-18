class NeuralNetwork {
   constructor(neuronCounts) {
      this.levels = [];
      for (let i = 0; i < neuronCounts.length - 1; i++) {
         this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
      }
   }

   static feedForward(givenInputs, network, binarize = true) {
      let outputs = Level.feedForward(
         givenInputs,
         network.levels[0],
         binarize//network.levels.length == 1 || binarize
      );
      for (let i = 1; i < network.levels.length; i++) {
         outputs = Level.feedForward(
            outputs,
            network.levels[i],
            binarize//i == network.levels.length - 1 || binarize
         );
      }
      return outputs;
   }

   static giveWeightsAndBiases(network,wab){
      for(let i=0;i<network.levels.length;i++){
         const level=network.levels[i];
         for(let j=0;j<level.biases.length;j++){
             if(wab.levels[i] && wab.levels[i].biases[j]){
                 level.biases[j]=wab.levels[i].biases[j]
             }
         }
         for(let j=0;j<level.weights.length;j++){
         for(let k=0;k<level.weights[j].length;k++){
             if(wab.levels[i] && wab.levels[i].weights[j] &&wab.levels[i].weights[j][k]){
                 level.weights[j][k]=wab.levels[i].weights[j][k]
             }
         }
         }
     }
   }

   static makeZeros(network) {
      network.levels.forEach((level) => {
         for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = 0;
         }
         for (let i = 0; i < level.weights.length; i++) {
            for (let j = 0; j < level.weights[i].length; j++) {
               level.weights[i][j] = 0;
            }
         }
      });
   }

   static newMutate(network, amount = 1, biasSubset = [], weightSubset = []) {
      for (let li = 0; li < network.levels.length; li++) {
         const level = network.levels[li];
         for (let i = 0; i < level.biases.length; i++) {
            if (
               biasSubset.find((p) => p.levelIndex == li && p.index == i)
            ) {
               level.biases[i] = lerp(
                  level.biases[i],
                  Math.floor(100*(Math.random() * 2 - 1))/100,
                  amount
               );
            }
         }
         for (let i = 0; i < level.weights.length; i++) {
            for (let j = 0; j < level.weights[i].length; j++) {
               if (
                  weightSubset.find(
                     (s) =>
                        s.levelIndex == li &&
                        s.indices[0] == i &&
                        s.indices[1] == j
                  )
               ) {
                  level.weights[i][j] = lerp(
                     level.weights[i][j],
                     Math.floor(100*(Math.random() * 2 - 1))/100,
                     amount
                  );
               }
            }
         }
      }
   }

   static oldMutate(network, amount = 1) {
      network.levels.forEach((level) => {
         for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = lerp(
               level.biases[i],
               Math.random() * 2 - 1,
               amount
            );
         }
         for (let i = 0; i < level.weights.length; i++) {
            for (let j = 0; j < level.weights[i].length; j++) {
               level.weights[i][j] = lerp(
                  level.weights[i][j],
                  Math.random() * 2 - 1,
                  amount
               );
            }
         }
      });
   }

   static mutateWeights(network, amount = 1) {
      network.levels.forEach((level) => {
         for (let i = 0; i < level.weights.length; i++) {
            for (let j = 0; j < level.weights[i].length; j++) {
               level.weights[i][j] = lerp(
                  level.weights[i][j],
                  Math.random() * 2 - 1,
                  amount
               );
            }
         }
      });
   }

   static mutate = NeuralNetwork.newMutate;
}

class Level {
   constructor(inputCount, outputCount) {
      this.inputs = new Array(inputCount);
      this.outputs = new Array(outputCount);
      this.biases = new Array(outputCount);

      this.weights = [];
      for (let i = 0; i < inputCount; i++) {
         this.weights[i] = new Array(outputCount);
      }

      Level.#randomize(this);
   }

   static #randomize(level) {
      for (let i = 0; i < level.inputs.length; i++) {
         for (let j = 0; j < level.outputs.length; j++) {
            level.weights[i][j] = Math.random() * 2 - 1;
         }
      }

      for (let i = 0; i < level.biases.length; i++) {
         level.biases[i] = Math.random() * 2 - 1;
      }
   }

   static feedForward(givenInputs, level, binarize) {
      for (let i = 0; i < level.inputs.length; i++) {
         level.inputs[i] = givenInputs[i];
      }

      for (let i = 0; i < level.outputs.length; i++) {
         let sum = 0;
         for (let j = 0; j < level.inputs.length; j++) {
            sum += level.inputs[j] * level.weights[j][i];
         }
         
/*
         if (sum > level.biases[i]) {
            level.outputs[i] = 1;
         } else {
            level.outputs[i] = 0;
         }*/
         
         //level.outputs[i] = Math.tanh(sum + level.biases[i]);
         if (binarize) {
            //if (sum > level.biases[i]) {
            if (sum - level.biases[i] > 0) {
               level.outputs[i] = 1;
            } else {
               level.outputs[i] = 0;
            }
         } else {
            level.outputs[i] = sum - level.biases[i];
            //level.outputs[i] = Math.tanh(sum + level.biases[i]);
         }
      }

      return level.outputs;
   }
}
