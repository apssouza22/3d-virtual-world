class DecisionBoundary {
   constructor(container, brain, options) {
      this.container = container;
      this.canvas = document.createElement("canvas");
      this.canvas.height = 300;
      this.canvas.width = 300;
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.brain = brain;

      container.appendChild(document.createElement("br"));
      this.selectElement = document.createElement("select");
      container.appendChild(this.selectElement);

      for (const optionText of options) {
         const optionElement = document.createElement("option");
         optionElement.value = optionText;
         optionElement.textContent = optionText;
         this.selectElement.appendChild(optionElement);
      }

      this.selectElement.addEventListener("change", () => {
         const selectedOptionIndex = this.selectElement.selectedIndex;
         this.updateImage(selectedOptionIndex);
      });
      this.updateImage(0);
   }

   updateImage(selectedOutput = 0) {
      for (let x = 0; x < this.canvas.width; x++) {
         for (let y = 0; y < this.canvas.height; y++) {
            const point = [1 - y / this.canvas.height, x / this.canvas.width];
            const outputs = NeuralNetwork.feedForward(point, this.brain);

            const color = outputs[selectedOutput] > 0 ? "white" : "black";
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, 1, 1);
         }
      }

      this.bg = new Image();
      this.bg.src = this.canvas.toDataURL();
   }

   draw(point) {
      this.ctx.drawImage(this.bg, 0, 0);
      const loc = {
         x: point[1] * this.canvas.width,
         y: (1 - point[0]) * this.canvas.height,
      };
      this.ctx.beginPath();
      this.ctx.arc(loc.x, loc.y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = "yellow";
      this.ctx.fill();
   }
}
