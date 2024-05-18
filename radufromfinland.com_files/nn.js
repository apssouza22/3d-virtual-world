class NN extends Graph {
   constructor(points, segments) {
      super(points, segments);
      this.colors = {};
      this.colors["🠉"] = outputColors[0];
      this.colors["🠈"] = outputColors[1];
      this.colors["🠊"] = outputColors[2];
      this.colors["🠋"] = outputColors[3];
      this.inputNodes = points.filter((p) => p.inputNode);
      this.outputNodes = points.filter((p) => p.outputNode);
   }

   static load(info,height=null) {
      const graph = Graph.load(info);

      let yScaler=1;
      const margin=50;
      if(height){
         const maxY=Math.max(...info.points.map(p=>p.y));
         const minY=Math.min(...info.points.map(p=>p.y));
         yScaler=(height-margin-margin)/(maxY-minY);
      }
      for (let i = 0; i < info.points.length; i++) {
         graph.points[i].value = info.points[i].value;
         graph.points[i].bias = info.points[i].bias;
         graph.points[i].inputNode = info.points[i].inputNode;
         graph.points[i].outputNode = info.points[i].outputNode;
         graph.points[i].label = info.points[i].label;
         graph.points[i].marked = info.points[i].marked;
         graph.points[i].view = info.points[i].view;
         graph.points[i].y=margin+(info.points[i].y-margin)*yScaler;
      }
      for (let i = 0; i < info.segments.length; i++) {
         graph.segments[i].weight = info.segments[i].weight;
         graph.segments[i].marked = info.segments[i].marked;
         graph.segments[i].p1.y=margin+(info.segments[i].p1.y-margin)*yScaler;
         graph.segments[i].p2.y=margin+(info.segments[i].p2.y-margin)*yScaler;
      }
      const nn = new NN(graph.points, graph.segments);
      return nn;
   }

   mutate(amount) {
      for (const point of this.points) {
         if (!point.inputNode) {
            if (point.marked) {
               point.bias = lerp(
                  point.bias,
                  Math.floor(100 * (Math.random() * 2 - 1)) / 100,
                  amount
               );
            }
         }
      }
      for (const seg of this.segments) {
         if (seg.marked) {
            seg.weight = lerp(
               seg.weight,
               Math.floor(100 * (Math.random() * 2 - 1)) / 100,
               amount
            );
         }
      }
   }

   feedForward(givenInputs) {
      for (const point of this.points) {
         point.value = null;
         point.inCount = 0;
         point.outCount = 0;
         point.cnt = 0;
         point.sum = 0;
      }
      for (const seg of this.segments) {
         seg.p1.outCount++;
         seg.p2.inCount++;
         seg.signal = null;
      }
      for (const point of this.points) {
         if(point.inCount==0){
            point.value=-point.bias>0?1:0;;
         }
      }
      for (let i = 0; i < givenInputs.length; i++) {
         this.inputNodes[i].value = givenInputs[i];
      }

      let ok = false;
      let processedPoints = 0;
      let cnt = 0;
      let processedSegments = 0;
      while (ok == false) {
         ok = true;

         const segsFromPointsWithValues = this.segments.filter(
            (s) => s.p1.value != null && s.signal == null
         );
         for (const seg of segsFromPointsWithValues) {
            seg.signal = seg.weight * seg.p1.value;
            processedSegments++;
         }

         const segsToPointsWithoutValues = this.segments.filter(
            (s) => s.p2.value == null && s.signal != null
         );
         for (const seg of segsToPointsWithoutValues) {
            seg.p2.cnt++;
            seg.p2.sum += seg.signal;
         }
         for (const seg of segsToPointsWithoutValues) {
            if(seg.p2.cnt==seg.p2.inCount){
               seg.p2.value = seg.p2.sum - seg.p2.bias > 0 ? 1 : 0;
            }else{
               seg.p2.cnt=0;
            }
         }

         if (processedSegments != this.segments.length) {
            ok = false;
         }
      }
/*
      
      for (const point of this.points) {
         if(point.value==null){
            point.value=-point.bias>0?1:0;
         }
      }*/
      return this.outputNodes.map((n) => n.value);
   }

   drawNode(point, ctx) {
      ctx.beginPath();
      const size = 27;
      const rad = size / 2;
      ctx.arc(point.x, point.y, rad, 0, Math.PI * 2);

      /*
        if (point.view) {
            ctx.strokeStyle = "green";
            ctx.lineWidth = 30;
            ctx.stroke();
        }
        */

      ctx.fillStyle = "black";
      ctx.fill();
      //if (!point.inputNode) {
         if (point.outputNode) {
            ctx.fillStyle = getRGBA(point.value);
            ctx.fill();
         } else {
            ctx.fillStyle = getRGBA(point.value);
            ctx.fill();
         }
      //}

      ctx.strokeStyle = point.marked
         ? point.inputNode
            ? "white"
            : "red"
         : "black";
      ctx.lineWidth = 4;
      ctx.stroke();

      if (point.bias) {
         ctx.setLineDash([3, 3]);
         ctx.lineWidth = 4;
         ctx.strokeStyle = getRGBA(point.bias);
         ctx.stroke();
         ctx.setLineDash([]);
      }

      if (point.label) {
         if(point.inputNode){
            return;
         }
         ctx.beginPath();
         ctx.textAlign = "center";
         ctx.textBaseline = "middle";
         //ctx.fillStyle = this.colors[point.label];
         //ctx.strokeStyle = "black";
         ctx.fillStyle = "black";
         ctx.strokeStyle = "white";
         ctx.font = rad * 1.5 + "px Arial";
         const top = point.inputNode
            ? point.y + rad * 0.1
            : point.y + rad * 0.1;
         if (point.outputNode) {
            ctx.fillText(point.label, point.x, top);
            ctx.lineWidth = 0.5;
            ctx.strokeText(point.label, point.x, top);
         }
         if (point.inputNode) {
            const imggray = images[point.label]["gray"];
            ctx.globalAlpha = 0.2;
            ctx.drawImage(
               imggray,
               point.x - imggray.width / 2,
               top - imggray.height / 2
            );

            const img =
               point.value < 0
                  ? images[point.label]["blue"]
                  : images[point.label]["yellow"];
            ctx.globalAlpha = Math.abs(point.value);
            ctx.drawImage(img, point.x - img.width / 2, top - img.height / 2);
            ctx.globalAlpha = 1;
         }
      }
   }

   draw(ctx) {
      const size = 30;
      ctx.lineDashOffset = Math.floor(
         (100000 - (new Date().getTime() % 100000)) / 50
      );

      for (const seg of this.segments) {
         //seg.draw(this.ctx);
         //drawArrow2(seg.p1, seg.p2, ctx, getRGBA(seg.value), size / 2);
         if (seg.marked) {
            seg.draw(ctx, {
               color: "red",
               width: 10,
            });
         }
         seg.draw(ctx, {
            color: "rgba(0,0,0,0.3)",
            dash: [7, 3],
            width: 4,
         });
         seg.draw(ctx, {
            color: getRGBA(seg.weight*0.7+(seg.p1.value*seg.weight*0.3)),
            dash: [7, 3],
            width: 4,
         });
      }
      for (const point of this.points) {
         this.drawNode(point, ctx);
      }
   }
}
