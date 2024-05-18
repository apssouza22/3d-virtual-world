class Building {
   constructor(poly, height = 200) {
      this.base = poly;
      this.height = height;
      this.imgOffset = new Point(0, 0);
      this.imgScaler = 1;
      this.base.simplify();
   }

   static load(info, index) {
      const b = new Building(Polygon.load(info.base), info.height);
      if (info.id) {
         b.id = info.id;
      } else {
         b.id = index;
      }

      switch (b.id) {
         case 237888253:
            b.img = new Image();
            b.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/solenovo.png";
            b.imgScaler = 0.9;
            b.imgOffset = new Point(-50, -550);
            break;
         case 104710130:
            b.img = new Image();
            b.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/arbonaut.png";
            break;
         case 40351427:
            b.img = new Image();
            b.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/karelics.png";
            b.imgScaler = 1.3;
            break;
         case 87998750:
            b.img = new Image();
            b.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/tiedepuisto.png";
            b.imgScaler = 2.3;
            b.imgOffset = new Point(200, 0);
            break;
         case 1132503307:
            b.img = new Image();
            b.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/uef.png";
            b.imgScaler = 1.5;
            break;
         case 88110497:
            b.img = new Image();
            b.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/karelia.png";
            b.imgScaler = 1.3;
            b.imgOffset = new Point(-140, 430);
            b.floorPlan = new Image();
            b.floorPlan.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/floorplan.png";
            b.floorPlanScaler = 1;
            b.floorPlanOffset = new Point(50, 320);
            break;
         case 88040524:
            b.img = new Image();
            b.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/imgs/karelia.png";
            b.imgScaler = 1.4;
            b.imgOffset = new Point(-330, 0);
            break;
      }

      b.base.simplify();
      return b;
   }

   update(viewPoint) {
      const topPoints = this.base.points.map((p) =>
         getFake3dPoint(p, viewPoint, this.height * 0.6)
      );
      const ceiling = new Polygon(topPoints);
      ceiling.base=this.base;

      const sides = [];
      for (let i = 0; i < this.base.points.length; i++) {
         const nextI = (i + 1) % this.base.points.length;
         const poly = new Polygon([
            this.base.points[i],
            this.base.points[nextI],
            topPoints[nextI],
            topPoints[i],
         ]);
         sides.push(poly);
      }

      if (this.floorPlan) {
         const minX = Math.min(...this.base.points.map((p) => p.x));
         const maxX = Math.max(...this.base.points.map((p) => p.x));
         const minY = Math.min(...this.base.points.map((p) => p.y));
         const maxY = Math.max(...this.base.points.map((p) => p.y));
         const center = new Point((minX + maxX) / 2, (minY + maxY) / 2);
         this.base.floorPlan = this.floorPlan;
         this.base.floorPlanOffset = this.floorPlanOffset;
         this.base.floorPlanLoc = center;
         this.base.floorPlanSize = 1000;
      }
      if (this.img) {
         ceiling.img = this.img;
         ceiling.imgOffset = this.imgOffset;
         ceiling.imgScaler = this.imgScaler;

         const minX = Math.min(...this.base.points.map((p) => p.x));
         const maxX = Math.max(...this.base.points.map((p) => p.x));
         const minY = Math.min(...this.base.points.map((p) => p.y));
         const maxY = Math.max(...this.base.points.map((p) => p.y));
         const center = add(
            ceiling.imgOffset,
            new Point((minX + maxX) / 2, (minY + maxY) / 2)
         );
         ceiling.imgLoc = getFake3dPoint(center, viewPoint, this.height * 0.6);

         let rad = Number.MAX_SAFE_INTEGER;

         for (const seg of this.base.segments) {
            const d = seg.distanceToPoint(center);
            if (d < rad) {
               rad = d;
            }
         }
         rad /= Math.sqrt(2);
         rad *= 0.8;
         ceiling.imgSize = rad * 2 * ceiling.imgScaler;
      }

      let roofPolys = [];
      if (this.base.points.length == 4 || this.base.points.length == 5) {
         ceiling.dark = true;

         const baseMidpoints = [
            average(this.base.points[0], this.base.points[1]),
            average(this.base.points[2], this.base.points[3]),
         ];

         const topMidpoints = baseMidpoints.map((p) =>
            getFake3dPoint(p, viewPoint, this.height)
         );

         roofPolys = [
            new Polygon([
               ceiling.points[0],
               ceiling.points[3],
               topMidpoints[1],
               topMidpoints[0],
            ]),
            new Polygon([
               ceiling.points[2],
               ceiling.points[1],
               topMidpoints[0],
               topMidpoints[1],
            ]),
         ];
         roofPolys.sort(
            (a, b) =>
               b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
         );
      }
      return { ceiling, sides, roofPolys };
   }

   draw(ctx, viewPoint) {
      const topPoints = this.base.points.map((p) =>
         getFake3dPoint(p, viewPoint, this.height * 0.6)
      );
      const ceiling = new Polygon(topPoints);

      const sides = [];
      for (let i = 0; i < this.base.points.length; i++) {
         const nextI = (i + 1) % this.base.points.length;
         const poly = new Polygon([
            this.base.points[i],
            this.base.points[nextI],
            topPoints[nextI],
            topPoints[i],
         ]);
         sides.push(poly);
      }
      sides.sort(
         (a, b) => b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
      );

      /*
      const baseMidpoints = [
         average(this.base.points[0], this.base.points[1]),
         average(this.base.points[2], this.base.points[3])
      ];

      const topMidpoints = baseMidpoints.map((p) =>
         getFake3dPoint(p, viewPoint, this.height)
      );

      const roofPolys = [
         new Polygon([
            ceiling.points[0], ceiling.points[3],
            topMidpoints[1], topMidpoints[0]
         ]),
         new Polygon([
            ceiling.points[2], ceiling.points[1],
            topMidpoints[0], topMidpoints[1]
         ])
      ];
      roofPolys.sort(
         (a, b) =>
            b.distanceToPoint(viewPoint) -
            a.distanceToPoint(viewPoint)
      );
      */
      this.base.draw(ctx, {
         fill: "gray",
         stroke: "rgba(0,0,0,0.2)",
         lineWidth: 20,
      });
      for (const side of sides) {
         side.draw(ctx, { fill: "#999", stroke: "#555", join: "round" });
      }
      ceiling.draw(ctx, { fill: "#DDD", stroke: "#555", join: "round" });
      /*
      for (const poly of roofPolys) {
         poly.draw(ctx, { fill: "#D44", stroke: "#C44", lineWidth: 8, join: "round" });
      }*/
   }
}
