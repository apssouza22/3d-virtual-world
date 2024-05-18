class NNEditor {
   constructor(viewport, graph) {
      this.viewport = viewport;
      this.canvas = viewport.canvas;
      this.graph = graph;

      this.ctx = this.canvas.getContext("2d");

      this.selected = null;
      this.hovered = null;
      this.hoveredSegment = null;
      this.dragging = false;
      this.mouse = null;

      this.markedInputs = [];
   }

   static graphFromCar(car, cWidth, cHeight) {
      const network = car.brain;
      const inputLabels = ["⬉", "⬆", "⬈"].concat(car.brainOptions.extraInputs);
      const outputLabels = car.brainOptions.outputs;
      const margin = 50;
      const left = margin;
      const top = margin;
      const width = cWidth - margin * 2;
      const height = cHeight - margin * 2;
      const bottom = top + height;
      const right = left + width;

      const levelHeight = height / network.levels.length;

      const points = [];
      const segments = [];
      for (let lev = 0; lev < network.levels.length; lev++) {
         const levelTop = bottom - (lev + 1) * levelHeight;
         const levelBottom = bottom - lev * levelHeight;
         const level = network.levels[lev];
         const { inputs, outputs, weights, biases } = level;

         for (let i = 0; i < inputs.length; i++) {
            const x = Visualizer.getNodeX(inputs, i, left, right);
            let point = new Point(x, levelBottom);
            const found = points.find((p) => p.equals(point));
            if (found) {
               point = found;
            } else {
               points.push(point);
            }
            point.index = i;
            point.value = inputs[i];
            point.levelIndex = lev;
            point.inputNode = lev == 0;
            if (point.inputNode) {
               point.label = inputLabels[i];
            }
         }

         for (let i = 0; i < outputs.length; i++) {
            const x = Visualizer.getNodeX(outputs, i, left, right);
            let point = new Point(x, levelTop);
            const found = points.find((p) => p.equals(point));
            if (found) {
               point = found;
            } else {
               points.push(point);
            }
            point.index = i;
            point.value = outputs[i];
            point.bias = biases[i];
            point.levelIndex = lev;
            point.outputNode = lev == network.levels.length - 1;
            if (point.outputNode) {
               point.label = outputLabels[i];
            }
         }

         for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < outputs.length; j++) {
               let p1 = new Point(
                  Visualizer.getNodeX(inputs, i, left, right),
                  levelBottom
               );
               let found = points.find((p) => p.equals(p1));
               if (found) {
                  p1 = found;
               }
               let p2 = new Point(
                  Visualizer.getNodeX(outputs, j, left, right),
                  levelTop
               );
               found = points.find((p) => p.equals(p2));
               if (found) {
                  p2 = found;
               }
               const seg = new Segment(p1, p2);
               seg.weight = weights[i][j];
               segments.push(seg);
            }
         }
      }
      return new NN(points, segments);
   }

   markAll() {
      for (const point of this.graph.points) {
         if (!point.inputNode) {
            point.marked = true;
         }
      }
      for (const seg of this.graph.segments) {
         seg.marked = true;
      }
      save();
   }

   unmarkAll() {
      for (const point of this.graph.points) {
         if (!point.inputNode) {
            point.marked = false;
         }
      }
      for (const seg of this.graph.segments) {
         seg.marked = false;
      }
      save();
   }

   removeAllSegments() {
      this.graph.segments.length = 0;
      save();
   }

   zeroAll() {
      for (const point of this.graph.points) {
         if (!point.inputNode) {
            point.bias = 0;
         }
      }
      for (const seg of this.graph.segments) {
         seg.weight = 0;
      }
      save();
   }

   enable() {
      this.#addEventListeners();
   }

   disable() {
      this.#removeEventListeners();
      this.selected = false;
      this.hovered = false;
   }

   #addEventListeners() {
      this.boundKeyDown = this.#handleKeyDown.bind(this);
      this.boundMouseWheel = this.#handleMouseWheel.bind(this);
      this.boundMouseDown = this.#handleMouseDown.bind(this);
      this.boundMouseMove = this.#handleMouseMove.bind(this);
      this.boundMouseUp = () => {this.dragging = false; save();};
      this.boundContextMenu = (evt) => evt.preventDefault();
      document.addEventListener("keydown", this.boundKeyDown);
      this.canvas.addEventListener("mousewheel", this.boundMouseWheel);
      this.canvas.addEventListener("mousedown", this.boundMouseDown);
      this.canvas.addEventListener("mousemove", this.boundMouseMove);
      this.canvas.addEventListener("mouseup", this.boundMouseUp);
      this.canvas.addEventListener("contextmenu", this.boundContextMenu);
   }

   #removeEventListeners() {
      document.removeEventListener("keydown", this.boundKeyDown);
      this.canvas.removeEventListener("mousewheel", this.boundMouseWheel);
      this.canvas.removeEventListener("mousedown", this.boundMouseDown);
      this.canvas.removeEventListener("mousemove", this.boundMouseMove);
      this.canvas.removeEventListener("mouseup", this.boundMouseUp);
      this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
   }

   #handleKeyDown(evt) {
      const key = evt.key;
      switch (key) {
         case "Delete":
            if (this.hovered) {
               if (this.hovered.inputNode || this.hovered.outputNode) {
                  console.error("Can't delete");
               } else {
                  this.#removePoint(this.hovered);
                  this.hovered = null;
                  save();
               }
            } else if (this.hoveredSegment) {
               this.graph.removeSegment(this.hoveredSegment);
               this.hoveredSegment = null;
               save();
            }
            break;
         /*
         case "m":
            if (this.hovered) {
               // && !this.hovered.inputNode) {
               this.hovered.marked = !this.hovered.marked;
               save();
            } else if (this.hoveredSegment) {
               this.hoveredSegment.marked = !this.hoveredSegment.marked;
               save();
            }
            break;*/
         /*
            case "v":
                if (
                    this.hovered &&
                    (this.hovered.inputNode || this.hovered.outputNode)
                ) {
                    this.hovered.view = !this.hovered.view;
                    save();
                }
                break;*/
      }
   }

   #handleMouseWheel(evt) {
      const dir = Math.sign(evt.deltaY);
      const step = evt.shiftKey ? -0.01 : -0.1;
      if (this.hovered) {
         this.hovered.bias += dir * step;
         this.hovered.bias = Math.max(-1, Math.min(1, this.hovered.bias));
         save();
      }
      if (this.hoveredSegment) {
         this.hoveredSegment.weight += dir * step;
         this.hoveredSegment.weight = Math.max(
            -1,
            Math.min(1, this.hoveredSegment.weight)
         );
         save();
      }
   }

   #handleMouseMove(evt) {
      this.mouse = this.viewport.getMouse(evt, true);
      this.mouse.value = 0;
      this.mouse.bias = 0;

      this.hovered = getNearestPoint(
         this.mouse,
         this.graph.points,
         30 * this.viewport.zoom
      );
      if (!this.hovered) {
         this.hoveredSegment = getNearestSegment(
            this.mouse,
            this.graph.segments,
            30 * this.viewport.zoom
         );
      } else {
         this.hoveredSegment = null;
      }
      if (this.dragging == true) {
         this.selected.x = this.mouse.x;
         this.selected.y = this.mouse.y;
      }
   }

   #handleMouseDown(evt) {
      if (evt.button == 2) {
         // right click
         if (this.selected) {
            this.selected = null;
         } else if (this.hovered) {
            if (this.hovered.inputNode || this.hovered.outputNode) {
               console.error("Can't delete");
            } else {
               this.#removePoint(this.hovered);
            }
         } else if (this.hoveredSegment) {
            this.graph.removeSegment(this.hoveredSegment);
            this.hoveredSegment = null;
         }
      }
      if (evt.button == 0) {
         // left click
         if (this.hovered) {
            //this.#select(this.hovered);
            if(this.selected){
               const seg = new Segment(this.selected, this.hovered);
               seg.weight = 0;
               this.graph.tryAddSegment(seg);
               this.selected=null;
            }else{
               this.#select(this.hovered);
            }
            this.dragging = true;
            return;
         }
         if (this.selected) {
            this.#addPoint(this.mouse);
            return;
         }
         //this.#select(this.mouse);
         //this.hovered = this.mouse;
      }
      if (evt.button == 1) {
         // middle click
         if (this.hoveredSegment) {
            this.hoveredSegment.marked = !this.hoveredSegment.marked;
            save();
            return;
         }
         if (this.hovered) {
            this.hovered.marked = !this.hovered.marked;
            save();
            return;
         }
      }

   }

   #addPoint(point) {
      this.graph.addPoint(this.mouse);
      const seg = new Segment(this.selected, point);
      seg.weight = 0;
      this.graph.tryAddSegment(seg);
      this.selected = null;
   }

   #select(point) {
      if (this.selected) {
         const seg = new Segment(this.selected, point);
         seg.weight = 0;
         this.graph.tryAddSegment(seg);
      }
      this.selected = point;
   }

   #removePoint(point) {
      this.graph.removePoint(point);
      this.hovered = null;
      if (this.selected == point) {
         this.selected = null;
      }
   }

   dispose() {
      this.graph.dispose();
      this.selected = null;
      this.hovered = null;
   }

   showHighlight(value) {
      const rad = 20;
      this.ctx.save();
      this.ctx.setLineDash([]);
      this.ctx.beginPath();
      this.ctx.fillStyle = "black";
      this.ctx.strokeStyle = "white";
      this.ctx.rect(this.mouse.x, this.mouse.y - rad, rad, rad);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.arc(this.mouse.x + rad, this.mouse.y - rad, rad, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = "white"; //getRGBA(val);
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.font = "bold " + rad * 0.8 + "px Arial";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      if (value) {
         this.ctx.fillText(
            value.toFixed(2),
            this.mouse.x + rad,
            this.mouse.y - rad
         );
      } /*
            ctx.strokeText(
               val.toFixed(2),
               Visualizer.mouse.x + rad,
               Visualizer.mouse.y - rad
            );*/

      this.ctx.restore();
   }

   display() {
      if (this.hoveredSegment) {
         this.hoveredSegment.draw(this.ctx, { width: 10, color: "white" });
      }
      this.graph.draw(this.ctx);

      if (this.hovered) {
         this.hovered.draw(this.ctx, { size: 30, color: "rgba(255,255,255,0.5)" });
      }
      if (this.selected) {
         const intent = this.hovered ? this.hovered : this.mouse;
         //new Segment(this.selected, intent).draw(this.ctx, { color:"#AAA",dash: [3, 3] });
         drawArrow2(this.selected, intent, this.ctx, "#AAA", 0, 6);
         this.selected.draw(this.ctx, { color: "white" });
      }
      if (this.specialEdit) {
         if (this.mouse) {
            this.mouse.draw(this.ctx, { size: this.radius * 2 });
         }
      }

      if (this.hoveredSegment) {
         this.showHighlight(this.hoveredSegment.weight);
      }
      if (this.hovered) {
         this.showHighlight(
            this.hovered.bias ? this.hovered.bias : this.hovered.value
         );
      }
   }
}
