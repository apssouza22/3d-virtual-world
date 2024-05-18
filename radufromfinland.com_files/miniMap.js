class MiniMap {
    constructor(canvas, graph, size) {
        this.canvas = canvas;
        this.graph = graph;
        this.size = size;

        canvas.width = this.size;
        canvas.height = this.size;
        this.ctx = canvas.getContext("2d");

        this.targets = [];

        this.setupWarp();
        this.doWarp = false;
    }

    update(viewPoint) {
        this.ctx.clearRect(0, 0, this.size, this.size);

        const scaler = 0.03;
        const scaledViewPoint = scale(viewPoint, -scaler);
        this.ctx.save();
        this.ctx.translate(
            scaledViewPoint.x + this.size / 2,
            scaledViewPoint.y + this.size / 2
        );
        this.ctx.scale(scaler, scaler);

        for (const seg of this.graph.segments) {
            seg.draw(this.ctx, {
                width: 1 / scaler,
                color: "white",
                cap: "round",
            });
        }

        if (bestCar&& bestCar.shortestPath) {
            for (const seg of bestCar.shortestPath) {
                seg.draw(this.ctx, {
                    width: 8 / scaler,
                    color: "black",
                    cap: "round",
                });
            }
            for (const seg of bestCar.shortestPath) {
                seg.draw(this.ctx, {
                    width: 3 / scaler,
                    color: bestCar.color,
                    cap: "round",
                });
            }
        }

        for (const target of this.targets) {
            const size = 20 / scaler;
            const p = new Point(target.center.x, target.center.y);
            p.draw(this.ctx, {
                color: "white",
                size: 30 / scaler,
            });
            // this.ctx.drawImage(
            //     target.img,
            //     p.x - size / 2,
            //     p.y - size / 2,
            //     size,
            //     size
            // );
        }
        /*
      if(this.img && this.destination){
         const size=20/scaler;
         const p=new Point( this.destination.x,  this.destination.y);
         p.draw(this.ctx, {
            color: "white",
            size:30/scaler
         });
         this.ctx.drawImage(
            this.img,
            p.x- size / 2,p.y- size / 2,
            size,
            size
         );
      }*/

        new Point(bestCar.x, bestCar.y).draw(this.ctx, {
            color: bestCar.color,
            outline: true,
            size: 20 / scaler,
        });

        for (const car of cars) {
            if (car!=bestCar) {
                new Point(car.x, car.y).draw(this.ctx, {
                    color: car.color,
                    //outline: true,
                    size: 8 / scaler,
                });
            }
        }

        const sz = this.size / scaler;
        const w = viewport.zoom * viewport.canvas.width;
        const h = viewport.zoom * viewport.canvas.height;
        this.ctx.beginPath();
        this.ctx.rect(
            viewPoint.x - sz / 2,
            viewPoint.y - sz / 2,
            sz,
            sz / 2 - h / 2
        );
        this.ctx.rect(
            viewPoint.x - sz / 2,
            viewPoint.y + h / 2,
            sz,
            sz / 2 - h / 2
        );
        this.ctx.rect(
            viewPoint.x - sz / 2,
            viewPoint.y - h / 2,
            sz / 2 - w / 2,
            h
        );
        this.ctx.rect(
            viewPoint.x + w / 2,
            viewPoint.y - h / 2,
            sz / 2 - w / 2,
            h
        );

        this.ctx.fillStyle = "rgba(0,0,0,0.3)";
        this.ctx.lineWidth = 0.5 / scaler;
        this.ctx.fill();

        /*
      this.ctx.beginPath();
      this.ctx.rect(
         viewPoint.x-viewport.zoom*viewport.canvas.width/2,
         viewPoint.y-viewport.zoom*viewport.canvas.height/2,
         viewport.zoom*viewport.canvas.width,
         viewport.zoom*viewport.canvas.height
      );
      console.log(-viewport.canvas.width/2,
      -viewport.canvas.height/2,
      viewport.canvas.width,
      viewport.canvas.height);
      this.ctx.strokeStyle="white";
      this.ctx.fillStyle="rgba(0,0,0,0.2)";
      this.ctx.lineWidth=0.5/scaler;
      this.ctx.stroke();
      this.ctx.fill();
*/

        this.ctx.restore();

        if (this.doWarp) {
            this.warp();
        }
    }

    setupWarp() {
        if (this.newImgData == null) {
            this.newImgData = this.ctx.createImageData(
                this.canvas.width,
                this.canvas.height
            );

            this.offset = {
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
            };

            this.diag = Math.hypot(this.canvas.width, this.canvas.height) / 6;

            this.newIs = [];

            for (let i = 0; i < this.newImgData.data.length; i += 4) {
                const pIndex = i / 4;
                const x = (pIndex % this.canvas.width) - this.offset.x;
                const y =
                    Math.floor(pIndex / this.canvas.width) - this.offset.y;

                const mag = Math.hypot(x, y);
                const dir = Math.atan2(y, x);
                const newMag = this.diag * Math.tan((0.5 * mag) / this.diag);

                const newXY = {
                    x: Math.round(Math.cos(dir) * newMag + this.offset.x),
                    y: Math.round(Math.sin(dir) * newMag + this.offset.y),
                };

                const newI = (newXY.y * this.newImgData.width + newXY.x) * 4;
                this.newIs[pIndex] = newI;
                /*
            if (
               newMag < this.diag * 2.6 &&
               newI < this.newImgData.data.length
            ) {
               this.newImgData.data[i + 3] = Math.round(
                  255 * (1 - (newMag / (this.diag * 2.6)) ** 2)
               );
               this.newImgData.data[i + 2] = Math.round(
                  255 * (1 - (newMag / (this.diag * 2.6)) ** 2)
               );
               this.newImgData.data[i + 1] = Math.round(
                  255 * (1 - (newMag / (this.diag * 2.6)) ** 2)
               );
               this.newImgData.data[i + 0] = Math.round(
                  255 * (1 - (newMag / (this.diag * 2.6)) ** 2)
               );
            }*/
            }
        }
    }

    warp() {
        const { ctx, canvas, newImgData } = this;

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < newImgData.data.length; i += 4) {
            const pIndex = i / 4;
            const newI = this.newIs[pIndex];

            if (newI < imgData.data.length) {
                newImgData.data[i + 0] = imgData.data[newI + 0];
                newImgData.data[i + 1] = imgData.data[newI + 1];
                newImgData.data[i + 2] = imgData.data[newI + 2];
                newImgData.data[i + 3] = imgData.data[newI + 3] > 0 ? 70 : 0;
            }
        }
        /*
      for (let y = 1; y < canvas.height - 1; y++) {
         for (let x = 1; x < canvas.width - 1; x++) {
            const pIndex = y * canvas.width * 4 + x * 4;
            const top = (y - 1) * canvas.width * 4 + x * 4;
            const bottom = (y + 1) * canvas.width * 4 + x * 4;
            const left = y * canvas.width * 4 + (x - 1) * 4;
            const right = y * canvas.width * 4 + (x + 1) * 4;
            const topLeft = (y - 1) * canvas.width * 4 + (x - 1) * 4;
            const topRight = (y - 1) * canvas.width * 4 + (x + 1) * 4;
            const bottomLeft = (y + 1) * canvas.width * 4 + (x - 1) * 4;
            const bottomRight = (y + 1) * canvas.width * 4 + (x + 1) * 4;
            for (let i = 0; i <= 3; i++) {
               newImgData.data[pIndex + i] = newImgData.data[pIndex + i] / 2 +
                  (newImgData.data[top + 0] +
                     newImgData.data[left + 0] +
                     newImgData.data[bottom + 0] +
                     newImgData.data[right + 0] + 
                     newImgData.data[topLeft + 0] + 
                     newImgData.data[topRight + 0] + 
                     newImgData.data[bottomLeft + 0] +
                     newImgData.data[bottomRight + 0]) / (16*2);
                
            }
         }
      }
*/
        ctx.putImageData(newImgData, 0, 0);
    }
}
