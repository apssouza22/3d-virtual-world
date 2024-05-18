class Water {
   static load(waterInfo) {
      const water = new Water([]);
      water.polys = waterInfo.polys.map((p) => 
         new Polygon(p.points)
      );
      water.innerPolys = waterInfo.innerPolys.map((p) =>
         new Polygon(p.points)
      );
      return water;
   }

   constructor(polys, osm_obj) {
      /*const relation = osm_obj.elements
         .filter((w) => w.type == "relation")
         .map((r) => r.members);*/

      // SKIP! 1065353689
      let polyPoints = [];
      for (const poly of polys) {
         if (poly.id == 23842938 || poly.id == 1065353686) {
            polyPoints = polyPoints.concat(poly.points);
         }
         if (poly.id == 650261846) {
            polyPoints = polyPoints.concat(poly.points.reverse());
         }
      }

      this.polys = [
         new Polygon(polyPoints),
         polys.filter((p) => p.id == 23767974)[0],
      ];

      const innerPolyIDs = [
         23768192, 23768066, 5114043, 23767896, 941885044, 938810226, 941885043,
         943545970,
      ];
      this.innerPolys = polys.filter((p) => innerPolyIDs.includes(p.id));
   }

   draw(ctx) {
      let color="#0096FF";

      for (const poly of this.polys) {
         poly.draw(ctx, { fill: color, stroke: "rgba(0,0,0,0)" });
      }

      ctx.globalCompositeOperation = "destination-out";

      for (const poly of this.innerPolys) {
         poly.draw(ctx, { fill: "black", stroke: "black" });
      }

      ctx.globalCompositeOperation = "source-over";
   }
}