class GraphEditor {
   constructor(viewport, graph) {
      this.viewport = viewport;
      this.canvas = viewport.canvas;
      this.graph = graph;

      this.ctx = this.canvas.getContext("2d");

      this.selected = null;
      this.hovered = null;
      this.dragging = false;
      this.mouse = null;

      this.specialEdit = true; // set this.useGrid=false; in world.js
      this.radius = 20; // regenerate grid if changing some things
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
      this.boundMouseDown = this.#handleMouseDown.bind(this);
      this.boundMouseMove = this.#handleMouseMove.bind(this);
      this.boundMouseUp = () => (this.dragging = false);
      this.boundContextMenu = (evt) => evt.preventDefault();
      this.canvas.addEventListener("mousedown", this.boundMouseDown);
      this.canvas.addEventListener("mousemove", this.boundMouseMove);
      this.canvas.addEventListener("mouseup", this.boundMouseUp);
      this.canvas.addEventListener("contextmenu", this.boundContextMenu);
   }

   #removeEventListeners() {
      this.canvas.removeEventListener("mousedown", this.boundMouseDown);
      this.canvas.removeEventListener("mousemove", this.boundMouseMove);
      this.canvas.removeEventListener("mouseup", this.boundMouseUp);
      this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
   }

   #handleMouseMove(evt) {
      this.mouse = this.viewport.getMouse(evt, true);

      if (this.specialEdit) {
         
         /*
         for(const b of world.buildings){
            if(b.base.distanceToPoint(this.mouse)<this.radius){
               console.log(b.id);
            }
         }
         */

         
         for(let i=0;i<world.roadBorders.length;i++){
            const seg=world.roadBorders[i];
            if(seg.distanceToPoint(this.mouse)<this.radius){
               seg.red=true;
            }else{
               seg.red=false;
            }
            //console.log(seg);
         }
         
         return;
         /*
         for(let i=0;i<world.layer0.length;i++){
            const seg=world.layer0[i];
            if(seg.distanceToPoint(this.mouse)<this.radius){
               seg.red=true;
            }else{
               seg.red=false;
            }
         }
         for(let i=0;i<world.layer1.length;i++){
            const seg=world.layer1[i];
            if(seg.distanceToPoint(this.mouse)<this.radius){
               seg.red=true;
            }else{
               seg.red=false;
            }
         }*/
      }

      this.hovered = getNearestPoint(
         this.mouse,
         this.graph.points,
         10 * this.viewport.zoom
      );
      if (this.dragging == true) {
         this.selected.x = this.mouse.x;
         this.selected.y = this.mouse.y;
      }

      let minDist = Number.MAX_SAFE_INTEGER;
      let nearest = null;
      for (const b of world.buildings) {
         const d = b.base.distanceToPoint(this.mouse);
         if (d < minDist) {
            minDist = d;
            nearest = b;
         }
      }
   }

   #handleMouseDown(evt) {
      if (evt.button == 2) {
         // right click
         if (this.selected) {
            this.selected = null;
         } else if (this.hovered) {
            this.#removePoint(this.hovered);
         }
         //
         if (this.specialEdit) {
            /*for(const seg of this.graph.segments){
               if(seg.distanceToPoint(this.mouse)<this.radius){
                  seg.layer=null;
               }
            }
            */

            
            for(let i=0;i<world.roadBorders.length;i++){
               const seg=world.roadBorders[i];
               if(seg.distanceToPoint(this.mouse)<this.radius){
                  world.roadBorders.splice(i,1);
                  i--;
               }
            }
            
            return;

/*
            for(let i=0;i<world.trees.length;i++){
               const t=world.trees[i];
               if(t.base.distanceToPoint(this.mouse)<this.radius){
                  world.trees.splice(i,1);
                  i--;
               }
            }
            return;*/
            /*
            for (let i = 0; i < this.graph.points.length; i++) {
               if (distance(this.graph.points[i], this.mouse) < this.radius) {
                  console.log("!");
                  this.#removePoint(this.graph.points[i]);
                  i--;
               }
            }
*/

/*
            for (let i = 0; i < world.buildings.length; i++) {
               if (
                  world.buildings[i].base.distanceToPoint(this.mouse) <
                  this.radius
               ) {
                  world.buildings.splice(i, 1);
                  i--;
               }
            }
            for (let i = 0; i < world.trees.length; i++) {
               if (
                  world.trees[i].base.distanceToPoint(this.mouse) < this.radius
               ) {
                  world.trees.splice(i, 1);
                  i--;
               }
            }*/
         }
      }
      if (evt.button == 0) {
         // left click
         if (this.hovered) {
            this.#select(this.hovered);
            this.dragging = true;
            return;
         }
         this.graph.addPoint(this.mouse);
         this.#select(this.mouse);
         this.hovered = this.mouse;
      }
   }

   #select(point) {
      if (this.selected) {
         this.graph.tryAddSegment(new Segment(this.selected, point));
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

   display() {
      this.graph.draw(this.ctx);
      if (this.hovered) {
         this.hovered.draw(this.ctx, { fill: true });
      }
      if (this.selected) {
         const intent = this.hovered ? this.hovered : this.mouse;
         new Segment(this.selected, intent).draw(ctx, { dash: [3, 3] });
         this.selected.draw(this.ctx, { outline: true });
      }
      if (this.specialEdit) {
         if (this.mouse) {
            this.mouse.draw(this.ctx, { size: this.radius * 2 });
         }
      }
   }
}
