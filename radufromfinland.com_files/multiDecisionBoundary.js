class MultiDecisionBoundary {
   constructor(container, nn, colors, pixelSize = 5) {
      this.pixelSize = pixelSize;
      this.container = container;
      this.canvas = document.createElement("canvas");
      this.canvas.height = 300;
      this.canvas.width = 300;
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.nn = nn;
      this.fuzzy = false;
      this.defaultValues = [];
      for (let i = 0; i < this.nn.inputNodes.length; i++) {
         this.defaultValues[i] = 0;
      }

      this.colors = colors;

      container.appendChild(document.createElement("br"));
      this.div = document.createElement("div");
      container.appendChild(this.div);

      //console.log(options,options.entries());
      //array iterator (second one)
      /*
      for (const [index, optionText] of options.entries()) {
         //for (const optionText of options) {
         const optionElement = document.createElement("button");
         optionElement.value = optionText;
         optionElement.textContent = optionText;
         optionElement.style.backgroundColor = this.colors[index];
         optionElement.style.color = "white"
         optionElement.style.cursor = "default";
         this.div.appendChild(optionElement);
      }*/

      this.updateImage();
   }

   updateBrain(nn) {
      this.nn = NN.load(JSON.parse(JSON.stringify(nn)));
      this.updateImage();
   }

   updateImage() {
      //this.ctx.globalAlpha=1;
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      //this.ctx.globalAlpha=0.5;
      this.ctx.globalCompositeOperation = "lighter";
      for (let x = 0; x < this.canvas.width; x += this.pixelSize) {
         for (let y = 0; y < this.canvas.height; y += this.pixelSize) {
            const point = this.nn.inputNodes.map((n) => n.value); //levels[0].inputs//this.defaultValues;//this.brain.levels[0].inputs.map((i) => 0);
            if (point[0] == undefined) {
               for (let i = 0; i < point.length; i++) {
                  point[i] = 0;
               }
            }
            let xDone = false;
            let yDone = false;
            for (let i = 0; i < this.nn.inputNodes.length; i++) {
               if (this.nn.inputNodes[i].marked) {
                  if (!xDone) {
                     point[i] = 2 * (1 - y / this.canvas.height) - 1;
                     xDone = true;
                  } else if (!yDone) {
                     point[i] = 2 * (x / this.canvas.width) - 1;
                     yDone = true;
                  }
               }
            }
            /*
            let index = 0;
            const inputsInfo =
               Visualizer.selectedInputs.length == 0
                  ? [
                       { inputPoint: true, index: 0 },
                       { inputPoint: true, index: 1 },
                    ]
                  : Visualizer.selectedInputs;
            for (const p of inputsInfo) {
               point[p.index] =
                  index == 0
                     ? 2*(1 - y / this.canvas.height)-1
                     : 2*(x / this.canvas.width)-1;
               index++;
            }*/
            //debugger;

            //const outputs = NeuralNetwork.feedForward(point, this.brain, !this.fuzzy);
            const outputs = this.nn.feedForward(point, !this.fuzzy);
            let any = false;
            for (let i = 0; i < outputs.length; i++) {
               if (this.fuzzy) {
                  this.ctx.globalAlpha = Math.max(
                     0,
                     Math.min(1, outputs[i] + 0.8)
                  );
                  this.ctx.fillStyle = this.colors[i];
                  this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize);
                  this.ctx.globalAlpha = 1;
               } else if (outputs[i] == 1) {
                  any = true;
                  //if(this.nn.outputNodes[i].view){
                  this.ctx.globalAlpha = 1;
                  this.ctx.fillStyle = this.colors[i];
                  this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize);
                  //}
               }
            } /*
            if (!any) {
               this.ctx.fillStyle = "black";
               this.ctx.fillRect(x, y, 1, 1);
            }*/
         }
      }

      this.bg = new Image();
      this.bg.src = this.canvas.toDataURL();
      this.ctx.globalCompositeOperation = "source-over";
      //this.ctx.globalAlpha=1;
   }

   draw(inputNodesArray) {
      this.ctx.drawImage(this.bg, 0, 0);
      drawArrow(
         this.ctx,
         0,
         this.canvas.height / 2,
         this.canvas.width,
         this.canvas.height / 2
      );
      drawArrow(
         this.ctx,
         this.canvas.width / 2,
         this.canvas.height,
         this.canvas.width / 2,
         0
      );


      for (const inputNodes of inputNodesArray) {
         let x = null;
         let y = null;
         for (let i = 0; i < inputNodes.length; i++) {
            if (inputNodes[i].marked == true) {
               if (y == null) {
                  y = inputNodes[i];
               } else if (x == null) {
                  x = inputNodes[i];
               }
            }
         }
         if(y==null){
            y=inputNodes[0];
         }
         if(x==null){
            x=inputNodes[1];
         }
         const loc = {
            x: ((x.value + 1) / 2) * this.canvas.width,
            y: ((1 - y.value) / 2) * this.canvas.height,
         };

         this.ctx.beginPath();
         this.ctx.arc(loc.x, loc.y, 5, 0, Math.PI * 2);
         this.ctx.fillStyle = "white";
         this.ctx.fill();

         
      this.ctx.beginPath();
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "top";
      this.ctx.fillStyle = "white";
      this.ctx.font = "20px Arial";
      this.ctx.fillText(x.label, this.canvas.width / 4, this.canvas.height / 2 + 6);

      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2-6, (this.canvas.height * 3) / 4);
      //this.ctx.rotate(-Math.PI / 2);
      this.ctx.beginPath();
      this.ctx.textAlign = "right";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "white";
      this.ctx.font = "20px Arial";
      this.ctx.fillText(y.label, 0, 0);
      this.ctx.restore();
      }
   }
}
