class Car extends WorldItem {
    constructor(x, y, angle = 0, carOptions) {
        super();
        this.x = x;
        this.y = y;
        this.angle = angle + Math.PI / 2;

        this.frameCount = 0;
        this.setOptions(carOptions);
        this.polygon = this.createPolygon();
    }

    setOptions(carOptions) {
        this.width = carOptions.width;
        this.height = carOptions.height;

        this.acceleration = carOptions.acceleration;
        this.maxSpeed = carOptions.maxSpeed;
        this.friction = carOptions.friction;
        this.color = carOptions.color;
        this.type = carOptions.type;
        this.autoForward = carOptions.autoForward;

        this.img = new Image();
        this.img.src = "https://radufromfinland.com/projects/virtualworld/CAR/car.png";
        this.carImg = this.img;
    }


    createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
        });
        return points;
    }


    draw(ctx) {
        this.img = this.carImg;
        this.frameCount++;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        ctx.drawImage(
            this.img,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
    }

    poly() {
        return new Polygon(this.polygon.map((p) => new Point(p.x, p.y)));
    }
}
