class Graph {
   constructor(points = [], segments = []) {
      this.points = points;
      this.segments = segments;
   }

   static load(info) {
      const points = info.points.map((i) => new Point(i.x, i.y));
      const segments = info.segments.map((i) => {
         const p1=new Point(i.p1.x,i.p1.y);
         const p2=new Point(i.p2.x,i.p2.y);
         const seg = new Segment(
            points.find((p) => p.equals(p1)),
            points.find((p) => p.equals(p2))
         );
         seg.oneWay = i.oneWay;
         seg.layer = i.layer;
         return seg;
      });
      const g= new Graph(points, segments);
      g.minLat=info.minLat;
      g.maxLat=info.maxLat;
      g.minLon=info.minLon;
      g.maxLon=info.maxLon;
      
      return g;
   }
   hash() {
      return JSON.stringify(this);
   }

   addPoint(point) {
      this.points.push(point);
   }

   containsPoint(point) {
      return this.points.find((p) => p.equals(point));
   }

   tryAddPoint(point) {
      if (!this.containsPoint(point)) {
         this.addPoint(point);
         return true;
      }
      return false;
   }

   removePoint(point) {
      const segs = this.getSegmentsWithPoint(point);
      for (const seg of segs) {
         this.removeSegment(seg);
      }
      this.points.splice(this.points.indexOf(point), 1);
   }

   addSegment(seg) {
      this.segments.push(seg);
   }

   containsSegment(seg) {
      return this.segments.find((s) => s.equals(seg));
   }

   tryAddSegment(seg) {
      if (!this.containsSegment(seg) && !seg.p1.equals(seg.p2)) {
         this.addSegment(seg);
         return true;
      }
      return false;
   }

   removeSegment(seg) {
      this.segments.splice(this.segments.indexOf(seg), 1);
   }

   getSegmentsWithPoint(point) {
      const segs = [];
      for (const seg of this.segments) {
         if (seg.includes(point)) {
            segs.push(seg);
         }
      }
      return segs;
   }

   
   getSegmentsLeavingFromPoint(point) {
      const segs = [];
      for (const seg of this.segments) {
         if (seg.oneWay) {
            if (seg.p1.equals(point)) {
               segs.push(seg);
            }
         } else {
            if (seg.includes(point)) {
               segs.push(seg);
            }
         }
      }
      return segs;
   }

   dispose() {
      this.points.length = 0;
      this.segments.length = 0;
   }

   shortestPath(car, endPoint) {
      const startSeg=car.segment;


      const endSeg = getNearestSegment(endPoint, this.segments);

      const projStart = startSeg.projectPoint(car);
      const projEnd = endSeg.projectPoint(endPoint);

      const start = projStart.point;
      const end = projEnd.point;

      //consider here connecting just in front of car with dir param
      const tmpSegs = [
         //new Segment(startSeg.p1, start),
         //new Segment(start, startSeg.p2),
         new Segment(endSeg.p1, end),
         new Segment(end, endSeg.p2),
      ];

      for(let i=0;i<this.segments.length;i++){
         if(this.segments[i].equals(startSeg)){
            this.segments.splice(i,1);
            break;
         }
      }

      
      const carDir = normalize(
         subtract(car.polygon[3], car.polygon[0])
      );
      const dirToSp1 = normalize(subtract(car, startSeg.p1));
      const dirToSp2 = normalize(subtract(car, startSeg.p2));
      if(dot(carDir, dirToSp1)>dot(carDir, dirToSp2)){
         tmpSegs.push(new Segment(start, startSeg.p1))
      }else{
         tmpSegs.push(new Segment(start, startSeg.p2))
      }


      this.segments.push(...tmpSegs);
      this.points.push(start);
      this.points.push(end);



      for (const point of this.points) {
         point.prev = null;
         point.cost = Number.MAX_SAFE_INTEGER;
         point.visited = false;
      }
  
      // Initialize priority queue
      const priorityQueue = new PriorityQueue();
      start.cost = 0;
      priorityQueue.enqueue(start, 0);
  
      while (!end.visited) {
        const currentPoint = priorityQueue.dequeue();
  
        currentPoint.visited = true;
  

        const segs = this.getSegmentsLeavingFromPoint(currentPoint);
  
        for (const seg of segs) {
          const ep = seg.p1.equals(currentPoint) ? seg.p2 : seg.p1;
          //if (!ep.visited) {
            const newCost = currentPoint.cost + seg.length();
            if (newCost < ep.cost) {
              ep.cost = newCost;
              ep.prev = currentPoint;
              priorityQueue.enqueue(ep, newCost);
            }
          //}
        }
      }
  
      let point = end;
      let cnt = 0;
      const path = [point];
      while (!point.equals(start) && point.prev) {
         path.push(point.prev);
         point = point.prev;
         cnt++;
      }

      this.removePoint(start);
      this.removePoint(end);
      this.segments.push(startSeg);

      return path;
    }

   shortestPath_SLOW(car, endPoint) {

      const startSeg=car.segment;


      const endSeg = getNearestSegment(endPoint, this.segments);

      const projStart = startSeg.projectPoint(car);
      const projEnd = endSeg.projectPoint(endPoint);

      const start = projStart.point;
      const end = projEnd.point;

      //consider here connecting just in front of car with dir param
      const tmpSegs = [
         //new Segment(startSeg.p1, start),
         //new Segment(start, startSeg.p2),
         new Segment(endSeg.p1, end),
         new Segment(end, endSeg.p2),
      ];

      for(let i=0;i<this.segments.length;i++){
         if(this.segments[i].equals(startSeg)){
            this.segments.splice(i,1);
            break;
         }
      }

      
      const carDir = normalize(
         subtract(car.polygon[3], car.polygon[0])
      );
      const dirToSp1 = normalize(subtract(car, startSeg.p1));
      const dirToSp2 = normalize(subtract(car, startSeg.p2));
      if(dot(carDir, dirToSp1)>dot(carDir, dirToSp2)){
         tmpSegs.push(new Segment(start, startSeg.p1))
      }else{
         tmpSegs.push(new Segment(start, startSeg.p2))
      }


      this.segments.push(...tmpSegs);
      this.points.push(start);
      this.points.push(end);

      for (const point of this.points) {
         point.prev = null;
         point.cost = Number.MAX_SAFE_INTEGER;
         point.visited = false;
      }
      start.cost = 0;
      while (!end.visited) {
         const unvisited = this.points.filter((n) => n.visited == false);

         const costs = unvisited.map((n) => n.cost);
         const minCost = Math.min(...costs);
         const point = unvisited.find((p) => p.cost == minCost);

         point.visited = true;

         const segs = this.getSegmentsLeavingFromPoint(point); //this.getSegmentsWithPoint(point);

         for (const seg of segs) {
            const ep = seg.p1.equals(point) ? seg.p2 : seg.p1;
            if (point.cost + seg.length() < ep.cost) {
               ep.cost = point.cost + seg.length();
               ep.prev = point;
            }
         }
      }
      let point = end;
      let cnt = 0;
      const path = [point];
      while (!point.equals(start) && point.prev) {
         path.push(point.prev);
         point = point.prev;
         cnt++;
      }

      this.removePoint(start);
      this.removePoint(end);
      this.segments.push(startSeg);

      return path;
   }

   draw(ctx) {
      for (const seg of this.segments) {
         seg.draw(ctx,{color:"black",width:20});
      }

      for (const point of this.points) {
         point.draw(ctx);
      }
   }
}

class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    const newNode = { element, priority };
    this.elements.push(newNode);
    this.bubbleUp(this.elements.length - 1);
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    if (this.elements.length === 1) {
      return this.elements.pop().element;
    }

    const top = this.elements[0];
    this.elements[0] = this.elements.pop();
    this.sinkDown(0);
    return top.element;
  }

  isEmpty() {
    return this.elements.length === 0;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.elements[index].priority < this.elements[parentIndex].priority) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  sinkDown(index) {
    const leftChildIndex = 2 * index + 1;
    const rightChildIndex = 2 * index + 2;
    let smallestIndex = index;

    if (
      leftChildIndex < this.elements.length &&
      this.elements[leftChildIndex].priority < this.elements[smallestIndex].priority
    ) {
      smallestIndex = leftChildIndex;
    }

    if (
      rightChildIndex < this.elements.length &&
      this.elements[rightChildIndex].priority < this.elements[smallestIndex].priority
    ) {
      smallestIndex = rightChildIndex;
    }

    if (smallestIndex !== index) {
      this.swap(index, smallestIndex);
      this.sinkDown(smallestIndex);
    }
  }

  swap(i, j) {
    const temp = this.elements[i];
    this.elements[i] = this.elements[j];
    this.elements[j] = temp;
  }
}