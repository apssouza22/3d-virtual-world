const Osm = {
   /*
[out:json];
(
  way['highway']
  ['highway' !~ 'pedestrian']
['highway' !~ 'footway']
['highway' !~ 'cycleway']
['highway' !~ 'path']
['highway' !~ 'service']
['highway' !~ 'corridor']
['highway' !~ 'track']
['highway' !~ 'steps']
['highway' !~ 'raceway']
['highway' !~ 'bridleway']
['highway' !~ 'proposed']
['highway' !~ 'construction']
['highway' !~ 'elevator']
['highway' !~ 'bus_guideway']
['access' !~ 'private']
['access' !~ 'no']
  ({{bbox}});
);
  
out body;
>;
out skel;
   */
   parseRoads: (data) => {
      const nodes = data.elements.filter((n) => n.type == "node");

      const lats = nodes.map((n) => n.lat);
      const lons = nodes.map((n) => n.lon);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      const deltaLat = maxLat - minLat;
      const deltaLon = maxLon - minLon;
      const ar = deltaLon / deltaLat;
      const height = deltaLat * 111000 * 10;
      const width = height * ar * Math.cos(degToRad(maxLat));

      const points = [];
      const segments = [];
      for (const node of nodes) {
         const y = invLerp(maxLat, minLat, node.lat) * height;
         const x = invLerp(minLon, maxLon, node.lon) * width;
         const point = new Point(x, y);
         point.id = node.id;
         points.push(point);
      }

      const ways = data.elements.filter((w) => w.type == "way");
      for (const way of ways) {
         const ids = way.nodes;
         for (let i = 1; i < ids.length; i++) {
            const prev = points.find((p) => p.id == ids[i - 1]);
            const cur = points.find((p) => p.id == ids[i]);
            const oneWay = way.tags.oneway || way.tags.lanes == 1;
            const layer = way.tags.layer;
            segments.push(new Segment(prev, cur, oneWay, layer));
         }
      }

      return { points, segments, minLat, maxLat, minLon, maxLon };
   },

   /*
for(let i=0;i<world.buildings.length;i++){
    const p=world.buildings[i].base;
    if(p.area()<10000){
        world.buildings.splice(i,1);
        i--;
    }
}

[out:json][timeout:25];
// gather results
(
  // query part for: “building”
  way["building"]
  ['building' !~ 'shed']
  ['building' !~ 'service']
  ['building' !~ 'carport']
  ['building' !~ 'roof']
  ['building' !~ 'parking']
  ['building' !~ 'bridge']
  
  ({{bbox}});

  relation["building"]({{bbox}});
);
// print results
out body;
>;
out skel qt;

*/
   parseBuildings: (data, minLat, maxLat, minLon, maxLon) => {
      const nodes = data.elements.filter((n) => n.type == "node");

      const deltaLat = maxLat - minLat;
      const deltaLon = maxLon - minLon;
      const ar = deltaLon / deltaLat;
      const height = deltaLat * 111000 * 10;
      const width = height * ar * Math.cos(degToRad(maxLat));

      const points = [];
      const segments = [];
      for (const node of nodes) {
         const y = invLerp(maxLat, minLat, node.lat) * height;
         const x = invLerp(minLon, maxLon, node.lon) * width;
         const point = new Point(x, y);
         point.id = node.id;
         points.push(point);
      }

      const ways = data.elements.filter((w) => w.type == "way");
      const buildings = [];
      for (const way of ways) {
         const ids = way.nodes;
         const polyPoints = [];
         for (let i = 0; i < ids.length; i++) {
            const cur = points.find((p) => p.id == ids[i]);
            polyPoints.push(cur);
         }
         const b = new Building(new Polygon(polyPoints));
         b.id = way.id;
         buildings.push(b);
      }

      return buildings;
   },

   /*
[out:json][timeout:25];
// gather results
(
  // query part for: “water”
  way["natural"="water"]({{bbox}});
  relation["natural"="water"]({{bbox}});
);
// print results
out body;
>;
out skel qt;
*/
   parseWaters: (data, minLat, maxLat, minLon, maxLon) => {
      const nodes = data.elements.filter((n) => n.type == "node");

      const deltaLat = maxLat - minLat;
      const deltaLon = maxLon - minLon;
      const ar = deltaLon / deltaLat;
      const height = deltaLat * 111000 * 10;
      const width = height * ar * Math.cos(degToRad(maxLat));

      const points = [];
      const polys = [];
      for (const node of nodes) {
         const y = invLerp(maxLat, minLat, node.lat) * height;
         const x = invLerp(minLon, maxLon, node.lon) * width;
         const point = new Point(x, y);
         point.id = node.id;
         points.push(point);
      }

      const ways = data.elements.filter((w) => w.type == "way");
      for (const way of ways) {
         const ids = way.nodes;
         const polyPoints = [];
         for (let i = 0; i < ids.length; i++) {
            const cur = points.find((p) => p.id == ids[i]);
            polyPoints.push(cur);
         }
         const poly = new Polygon(polyPoints);
         poly.id = way.id;
         polys.push(poly);
      }

      return new Water(polys);
   },

   /*
[out:json][timeout:25];
// gather results
(
  // query part for: “"traffic signals"”
  node["highway"="traffic_signals"]({{bbox}});
);
// print results
out body;
>;
out skel qt;
*/ parseLights: (data, minLat, maxLat, minLon, maxLon) => {
      const nodes = data.elements.filter((n) => n.type == "node");

      const deltaLat = maxLat - minLat;
      const deltaLon = maxLon - minLon;
      const ar = deltaLon / deltaLat;
      const height = deltaLat * 111000 * 10;
      const width = height * ar * Math.cos(degToRad(maxLat));

      const points = [];
      for (const node of nodes) {
         const y = invLerp(maxLat, minLat, node.lat) * height;
         const x = invLerp(minLon, maxLon, node.lon) * width;
         const point = new Point(x, y);
         point.id = node.id;
         points.push(point);
      }

      return points.map(
         (p) => new Light(p, new Point(0, 1), world.roadWidth / 2)
      );
   },

   /*
[out:json][timeout:25];
// gather results
(
  // query part for: “crosswalk”
  node["highway"="crossing"]({{bbox}});
);
// print results
out body;
>;
out skel qt;
*/
   parseCrossings: (data, minLat, maxLat, minLon, maxLon) => {
      const nodes = data.elements.filter((n) => n.type == "node");

      const deltaLat = maxLat - minLat;
      const deltaLon = maxLon - minLon;
      const ar = deltaLon / deltaLat;
      const height = deltaLat * 111000 * 10;
      const width = height * ar * Math.cos(degToRad(maxLat));

      const points = [];
      for (const node of nodes) {
         const y = invLerp(maxLat, minLat, node.lat) * height;
         const x = invLerp(minLon, maxLon, node.lon) * width;
         const point = new Point(x, y);
         point.id = node.id;
         points.push(point);
      }

      return points.map((p) => {
         const segs = world.graph.getSegmentsWithPoint(p);
         let dir = new Point(0, 1);
         if (segs.length == 2) {
            dir = normalize(subtract(segs[0].p1, segs[1].p2));
         }
         return new Crossing(p, dir, world.roadWidth,world.roadWidth/2);
      });
   },
};
