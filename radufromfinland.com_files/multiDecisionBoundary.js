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

      this.colors = colors;

      container.appendChild(document.createElement("br"));
      this.div = document.createElement("div");
      container.appendChild(this.div);
   }

   updateBrain(nn) {
      this.nn = NN.load(JSON.parse(JSON.stringify(nn)));
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
