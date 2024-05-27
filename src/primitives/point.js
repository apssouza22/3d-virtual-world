class Point {
    constructor(x, y, z = 0, round = true, offset = 0) {
        if (round) {
            this.x = Math.round(x);
            this.y = Math.round(y);
            this.z = Math.round(z);
        } else {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        this.offset = offset;
    }

    hash() {
        return Math.floor(this.x * 10000000 + this.y);
    }

    equals(point) {
        return this.x == point.x && this.y == point.y;
    }

    draw(ctx, {size = 18, color = "black", outline = false, fill = false} = {}) {
        const rad = size / 2;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(this.x, this.y, rad, 0, Math.PI * 2);
        ctx.fill();
        if (outline) {
            ctx.beginPath();
            ctx.lineWidth = size / 9;
            ctx.strokeStyle = "yellow";
            ctx.arc(this.x, this.y, rad * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (fill) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, rad * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = "yellow";
            ctx.fill();
        }
    }
}