class Sensor {
    constructor(
        car,
        {
            rayCount = 5,
            rayLength = 150,
            raySpread = Math.PI / 2,
            rayOffset = 0,
        } = {}
    ) {
        this.rayCount = rayCount;
        this.rayLength = rayLength;
        this.raySpread = raySpread;
        this.rayOffset = rayOffset;

        this.rays = [];
        this.readings = [];
    }

    update(info, roadBorders, minDotAngle = -1) {
        this.#castRays(info);
        this.readings = [];
        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(
                this.#getReading(this.rays[i], roadBorders, minDotAngle)
            );
        }
    }

    #getReading(ray, roadBorders, minDotAngle) {
        let touches = [];

        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(
                ray[0],
                ray[1],
                roadBorders[i][0],
                roadBorders[i][1]
            );
            if (touch) {
                const angle = dot(
                    normalize(subtract(ray[0], ray[1])),
                    normalize(
                        perpendicular(
                            subtract(roadBorders[i][0], roadBorders[i][1])
                        )
                    )
                );
                if (angle >= minDotAngle) {
                    touches.push(touch);
                }
            }
        }

        /*
      for (let i = 0; i < traffic.length; i++) {
         const poly = traffic[i].polygon;
         for (let j = 0; j < poly.length; j++) {
            const value = getIntersection(
               ray[0],
               ray[1],
               poly[j],
               poly[(j + 1) % poly.length]
            );
            if (value) {
               touches.push(value);
            }
         }
      }*/

        if (touches.length == 0) {
            return null;
        } else {
            const offsets = touches.map((e) => e.offset);
            const minOffset = Math.min(...offsets);
            return touches.find((e) => e.offset == minOffset);
        }
    }

    #castRays(info) {
        this.rays = [];
        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle =
                this.rayOffset +
                lerp(
                    this.raySpread / 2,
                    -this.raySpread / 2,
                    this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
                ) +
                info.angle;

            const start = { x: info.x, y: info.y };
            const end = {
                x: info.x - Math.sin(rayAngle) * this.rayLength,
                y: info.y - Math.cos(rayAngle) * this.rayLength,
            };
            this.rays.push([start, end]);
        }
    }

    draw(ctx, dot = false, line = false) {
        for (let i = 0; i < this.rayCount; i++) {
            let end = this.rays[i][1];
            if (this.readings[i]) {
                end = this.readings[i];
            }

            if (!dot) {
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "yellow";
                ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "black";
                ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            } else {
                if (line) {
                    if (this.readings[i]) {
                        ctx.beginPath();
                        ctx.globalAlpha=Math.min(1,Math.max(0,1-distance(this.rays[i][0],end)/250));
                        ctx.fillStyle = "white";//"blue";
                        ctx.strokeStyle = dot;
                        ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
                        ctx.lineTo(end.x, end.y);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                        ctx.globalAlpha=1;
                    }
                } else {
                    if (this.readings[i]) {
                        ctx.beginPath();
                        ctx.fillStyle = "red";
                        ctx.strokeStyle = dot;
                        ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            }
        }
    }
}
