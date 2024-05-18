class Grid {
   constructor(canvas, world, cellSize = 500) {
      if (canvas) {
         const points = [
            ...world.roadBorders.map((s) => [s.p1, s.p2]).flat(),
            ...world.buildings.map((b) => b.base.points).flat(),
         ];
         this.left = Math.min(...points.map((p) => p.x));
         this.right = Math.max(...points.map((p) => p.x));
         this.top = Math.min(...points.map((p) => p.y));
         this.bottom = Math.max(...points.map((p) => p.y));

         this.canvas = canvas;
         this.ctx = canvas.getContext("2d");

         this.cellSize = cellSize;

         this.width = this.right - this.left;
         this.height = this.bottom - this.top;

         this.cells = [];
         for (let i = 0; i < this.height / this.cellSize; i++) {
            this.cells[i] = [];
            for (let j = 0; j < this.width / this.cellSize; j++) {
               const x = this.left + j * this.cellSize;
               const y = this.top + i * this.cellSize;
               this.cells[i][j] = new Cell(i, j, x, y, this.cellSize);
            }
         }

         this.generate(world);
      }
   }

   static load(canvas, world, info) {
      const grid = new Grid();
      grid.left = info.left;
      grid.right = info.right;
      grid.top = info.top;
      grid.bottom = info.bottom;

      grid.canvas = canvas;
      grid.ctx = canvas.getContext("2d");

      grid.cellSize = info.cellSize;

      grid.width = grid.right - grid.left;
      grid.height = grid.bottom - grid.top;

      grid.cells = [];
      for (let i = 0; i < grid.height / grid.cellSize; i++) {
         grid.cells[i] = [];
         for (let j = 0; j < grid.width / grid.cellSize; j++) {
            const x = grid.left + j * grid.cellSize;
            const y = grid.top + i * grid.cellSize;
            grid.cells[i][j] = new Cell(i, j, x, y, grid.cellSize);
            grid.cells[i][j].worldItemIndices =
               info.cells[i][j].worldItemIndices;
         }
      }

      grid.generateRoadItemsFromIndices(world);
      return grid;
   }

   getCellIndices(loc) {
      return new Point(
         Math.floor((loc.x - this.left) / this.cellSize),
         Math.floor((loc.y - this.top) / this.cellSize)
      );
   }

   generate(world) {
      for (const row of this.cells) {
         for (const cell of row) {
            for (let i = 0; i < world.envelopes.length; i++) {
               const env = world.envelopes[i];
               if (
                  env.poly.intersectsPoly(cell.poly) ||
                  cell.poly.containsPoly(env.poly)
               ) {
                  cell.worldItems.envelopes.push(env);
                  cell.worldItemIndices.envelopes.push(i);
               }
            }
         }
      }
      for (const row of this.cells) {
         for (const cell of row) {
            for (let i = 0; i < world.markings.length; i++) {
               const mar = world.markings[i];
               if (cell.poly.containsPoint(mar.center)) {
                  cell.worldItems.markings.push(mar);
                  cell.worldItemIndices.markings.push(i);
               }
            }
         }
      }

      for (const row of this.cells) {
         for (const cell of row) {
            for (let i = 0; i < world.graph.segments.length; i++) {
               const seg = world.graph.segments[i];
               if (
                  cell.poly.intersectsSegment(seg) ||
                  cell.poly.containsSegment(seg)
               ) {
                  cell.worldItems.graphSegments.push(seg);
                  cell.worldItemIndices.graphSegments.push(i);
               }
            }
         }
      }

      for (const row of this.cells) {
         for (const cell of row) {
            for (let i = 0; i < world.roadBorders.length; i++) {
               const seg = world.roadBorders[i];
               if (
                  cell.poly.intersectsSegment(seg) ||
                  cell.poly.containsSegment(seg)
               ) {
                  cell.worldItems.roadBorders.push(seg);
                  cell.worldItemIndices.roadBorders.push(i);
               }
            }
         }
      }

      for (const row of this.cells) {
         for (const cell of row) {
            for (let i = 0; i < world.laneGuides.length; i++) {
               const seg = world.laneGuides[i];
               if (
                  cell.poly.intersectsSegment(seg) ||
                  cell.poly.containsSegment(seg)
               ) {
                  cell.worldItems.laneGuides.push(seg);
                  cell.worldItemIndices.laneGuides.push(i);
               }
            }
         }
      }

      for (const row of this.cells) {
         for (const cell of row) {
            for (let i = 0; i < world.buildings.length; i++) {
               const item = world.buildings[i];
               if (
                  item.base.intersectsPoly(cell.poly) ||
                  cell.poly.containsPoly(item.base)
               ) {
                  cell.worldItems.buildings.push(item);
                  cell.worldItemIndices.buildings.push(i);
               }
            }
         }
      }
      for (const row of this.cells) {
         for (const cell of row) {
            for (let i = 0; i < world.trees.length; i++) {
               const item = world.trees[i];
               if (
                  item.base.intersectsPoly(cell.poly) ||
                  cell.poly.containsPoly(item.base)
               ) {
                  cell.worldItems.trees.push(item);
                  cell.worldItemIndices.trees.push(i);
               }
            }
         }
      }
   }
   
   
   getDataFromNearbyCells(loc){
      const {x,y}=this.getCellIndices(loc);
      const cells=[];
      cells.push(this.cells[y][x]);
      this.cells[y-1]&&this.cells[y-1][x]?cells.push(this.cells[y-1][x]):true;
      this.cells[y+1]&&this.cells[y+1][x]?cells.push(this.cells[y+1][x]):true;
      this.cells[y-1]&&this.cells[y-1][x-1]?cells.push(this.cells[y-1][x-1]):true;
      this.cells[y]&&this.cells[y][x-1]?cells.push(this.cells[y][x-1]):true;
      this.cells[y+1]&&this.cells[y+1][x-1]?cells.push(this.cells[y+1][x-1]):true;
      this.cells[y-1]&&this.cells[y-1][x+1]?cells.push(this.cells[y-1][x+1]):true;
      this.cells[y]&&this.cells[y][x+1]?cells.push(this.cells[y][x+1]):true;
      this.cells[y+1]&&this.cells[y+1][x+1]?cells.push(this.cells[y+1][x+1]):true;

      const worldItems = {
         envelopes: [],
         markings: [],
         graphSegments: [],
         roadBorders: [],
         laneGuides: [],
         buildings: [],
         trees: [],
      };
      for (const cell of cells) {
         this.addItems(worldItems.envelopes, cell.worldItems.envelopes);
         this.addItems(worldItems.markings, cell.worldItems.markings);
         this.addItems(worldItems.graphSegments, cell.worldItems.graphSegments);
         this.addItems(worldItems.roadBorders, cell.worldItems.roadBorders);
         this.addItems(worldItems.laneGuides, cell.worldItems.laneGuides);
         this.addItems(worldItems.buildings, cell.worldItems.buildings);
         this.addItems(worldItems.trees, cell.worldItems.trees);
      }
      return worldItems;
   }

   getDataFromCellsInActiveRegion(activeRegion) {
      const worldItems = {
         envelopes: [],
         markings: [],
         graphSegments: [],
         roadBorders: [],
         laneGuides: [],
         buildings: [],
         trees: [],
      };
      const cells = this.getCellsInActiveRegion(activeRegion);
      for (const cell of cells) {
         this.addItems(worldItems.envelopes, cell.worldItems.envelopes);
         this.addItems(worldItems.markings, cell.worldItems.markings);
         this.addItems(worldItems.graphSegments, cell.worldItems.graphSegments);
         this.addItems(worldItems.roadBorders, cell.worldItems.roadBorders);
         this.addItems(worldItems.laneGuides, cell.worldItems.laneGuides);
         this.addItems(worldItems.buildings, cell.worldItems.buildings);
         this.addItems(worldItems.trees, cell.worldItems.trees);
      }
      return worldItems;
   }

   addItems(existing, newItems) {
      for (let item of newItems) {
         if (!existing.includes(item)) {
            existing.push(item);
         }
      }
   }

   getCellsInActiveRegion(activeRegion) {
      const cells = [];
      for (const row of this.cells) {
         for (const cell of row) {
            if (activeRegion.containsPoly(cell.poly) || cell.poly.containsPoly(activeRegion)) {
               cells.push(cell);
            }
         }
      }
      return cells;
   }

   generateRoadItemsFromIndices(world) {
      for (const row of this.cells) {
         for (const cell of row) {
            cell.worldItems.envelopes = cell.worldItemIndices.envelopes.map(
               (i) => world.envelopes[i]
            );
            cell.worldItems.markings = cell.worldItemIndices.markings.map(
               (i) => world.markings[i]
            );
            cell.worldItems.graphSegments =
               cell.worldItemIndices.graphSegments.map(
                  (i) => world.graph.segments[i]
               );
            cell.worldItems.roadBorders = cell.worldItemIndices.roadBorders.map(
               (i) => world.roadBorders[i]
            );
            cell.worldItems.laneGuides = cell.worldItemIndices.laneGuides.map(
               (i) => world.laneGuides[i]
            );
            cell.worldItems.buildings = cell.worldItemIndices.buildings.map(
               (i) => world.buildings[i]
            );
            cell.worldItems.trees = cell.worldItemIndices.trees.map(
               (i) => world.trees[i]
            );
         }
      }
   }

   display(activeRegion) {
      /*
      if (this.world.items) {
         for (const row of this.cells) {
            for (const cell of row) {
               cell.selected = false;
               for (const item of this.world.items) {
                  if (item.base.intersectsPoly(cell.poly)) {
                     cell.selected = true;
                     break;
                  }
               }
            }
         }
      }
      */
      for (const row of this.cells) {
         for (const cell of row) {
            cell.selected = false;
            if (activeRegion.containsPoly(cell.poly) || cell.poly.containsPoly(activeRegion) ) {
               cell.selected = true;
            }
         }
      }
      for (const row of this.cells) {
         for (const cell of row) {
            cell.draw(this.ctx);
         }
      }
   }
}

class Cell {
   constructor(i, j, x, y, cellSize) {
      this.i = i;
      this.j = j;
      this.x = x;
      this.y = y;
      this.cellSize = cellSize;

      this.left = x;
      this.right = this.left + cellSize;
      this.top = y;
      this.bottom = this.top + cellSize;

      this.poly = new Polygon([
         new Point(this.left, this.top),
         new Point(this.left, this.bottom),
         new Point(this.right, this.bottom),
         new Point(this.right, this.top),
      ]);

      this.selected = false;

      this.worldItems = {
         envelopes: [],
         markings: [],
         graphSegments: [],
         roadBorders: [],
         laneGuides: [],
         buildings: [],
         trees: [],
      };
      this.worldItemIndices = {
         envelopes: [],
         markings: [],
         graphSegments: [],
         roadBorders: [],
         laneGuides: [],
         buildings: [],
         trees: [],
      };
   }

   draw(ctx) {
      if (this.selected) {
         ctx.fillStyle = "rgba(0,0,0,0.2)";
         ctx.strokeStyle = "rgba(0,0,0,0.4)";
      } else {
         ctx.fillStyle = "rgba(0,0,255,0.6)";
         ctx.strokeStyle = "rgba(0,0,155,0.6)";
      }
      ctx.beginPath();
      ctx.rect(this.left, this.top, this.cellSize, this.cellSize);
      ctx.fill();
      ctx.stroke();
      ctx.textBaseline="top";
      ctx.font="30px Arial";
      ctx.fillStyle=ctx.strokeStyle;
      ctx.fillText(this.i+","+this.j,this.left,this.top);
   }
}

function drawCell(cell,ctx){
   //repeat the code above here with cell
   //if (cell.selected) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
   /*} else {
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.strokeStyle = "rgba(155,0,0,0.4)";
   }*/
   ctx.beginPath();
   ctx.rect(cell.left, cell.top, cell.cellSize, cell.cellSize);
   ctx.fill();
   ctx.stroke();
   ctx.textBaseline="top";
   ctx.font="30px Arial";
   ctx.fillStyle=ctx.strokeStyle;
   ctx.fillText(cell.i+","+cell.j,cell.left,cell.top);
}
