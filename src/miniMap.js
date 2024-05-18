class MiniMap {
    points = [];

    constructor(canvas, graph, size) {
        this.canvas = canvas;
        this.graph = graph;
        this.size = size;

        canvas.width = this.size;
        canvas.height = this.size;
        this.ctx = canvas.getContext("2d");

        /** @type {Target[]} */
        this.targets = [];

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

        for (const target of this.targets) {
            const size = 20 / scaler;
            const p = new Point(target.center.x, target.center.y);
            p.draw(this.ctx, {
                color: "white",
                size: 30 / scaler,
            });
            if(target.img){
                this.ctx.drawImage(
                    target.img,
                    p.x - size / 2,
                    p.y - size / 2,
                    size,
                    size
                );
            }
        }
        //TODO: implement a draw function to draw everything in the miniMap
        for (const point of this.points) {
            point.draw(this.ctx, {
                color: "red",
                outline: true,
                size: 20 / scaler,
            });
        }

        const sz = this.size / scaler;
        const w = viewport.zoom * viewport.canvas.width;
        const h = viewport.zoom * viewport.canvas.height;
        this.ctx.beginPath();
        this.ctx.rect(viewPoint.x - sz / 2, viewPoint.y - sz / 2, sz, sz / 2 - h / 2);
        this.ctx.rect(viewPoint.x - sz / 2, viewPoint.y + h / 2, sz, sz / 2 - h / 2);
        this.ctx.rect(viewPoint.x - sz / 2, viewPoint.y - h / 2, sz / 2 - w / 2, h);
        this.ctx.rect(viewPoint.x + w / 2, viewPoint.y - h / 2, sz / 2 - w / 2, h);

        this.ctx.fillStyle = "rgba(0,0,0,0.3)";
        this.ctx.lineWidth = 0.5 / scaler;
        this.ctx.fill();
        this.ctx.restore();
    }

}
