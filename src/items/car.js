class Car {
    constructor(x, y, angle = 0, carOptions) {
        this.ticks = 0;
        this.x = x;
        this.y = y;
        this.speed = 0;
        this.angle = angle + Math.PI / 2;

        this.frameCount = 0;
        this.state = "car";
        this.polygon = this.createPolygon();
        this.setOptions(carOptions);
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

        this.mask = document.createElement("canvas");
        this.mask.width = carOptions.width;
        this.mask.height = carOptions.height;

        this.carMask = this.mask;

        const maskCtx = this.mask.getContext("2d");
        this.img.onload = () => {
            maskCtx.fillStyle = carOptions.color;
            maskCtx.rect(0, 0, this.width, this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
        };

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


    draw(ctx, optimize = false) {
        this.img = this.carImg;
        this.mask = this.carMask;
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
}
