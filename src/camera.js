class Camera {

    constructor({x, y, angle}, range = 1000, distanceBehind = 150) {
        this.range = range;
        this.distanceBehind = distanceBehind;
        this.moveSimple({x, y, angle});
        this.#addEventListeners();
        this.drag = {
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0),
            active: false,
        };
    }

    move() {
        this.center = new Point(this.x, this.y);
        this.tip = new Point(
            this.x - this.range * Math.sin(this.angle),
            this.y - this.range * Math.cos(this.angle)
        );
        this.left = new Point(
            this.x - this.range * Math.sin(this.angle - Math.PI / 4),
            this.y - this.range * Math.cos(this.angle - Math.PI / 4)
        );
        this.right = new Point(
            this.x - this.range * Math.sin(this.angle + Math.PI / 4),
            this.y - this.range * Math.cos(this.angle + Math.PI / 4)
        );
        this.poly = new Polygon([
            this.center, this.left, this.right
        ]);

        this.poly.draw(carCtx);
    }

    moveAngle(angle) {
        this.angle = angle;
        this.move();
    }

    moveSimple({x, y, angle}) {
        this.x = x + this.distanceBehind * Math.sin(angle);
        this.y = y + this.distanceBehind * Math.cos(angle);
        this.z = -40;
        this.angle = angle;
        this.center = new Point(this.x, this.y);
        this.tip = new Point(
            this.x - this.range * Math.sin(this.angle),
            this.y - this.range * Math.cos(this.angle)
        );
        this.left = new Point(
            this.x - this.range * Math.sin(this.angle - Math.PI / 4),
            this.y - this.range * Math.cos(this.angle - Math.PI / 4)
        );
        this.right = new Point(
            this.x - this.range * Math.sin(this.angle + Math.PI / 4),
            this.y - this.range * Math.cos(this.angle + Math.PI / 4)
        );
        this.poly = new Polygon([
            this.center, this.left, this.right
        ]);
    }

    #projectPoint(ctx, p) {
        const seg = new Segment(this.center, this.tip);
        const {point: p1} = seg.projectPoint(p);
        const c = cross(subtract(p1, this), subtract(p, this));
        const x = Math.sign(c) * distance(p, p1) / distance(this, p1);
        const y = (p.z - this.z) / distance(this, p1);

        const cX = ctx.canvas.width / 2;
        const cY = ctx.canvas.height / 2;
        const scaler = Math.max(cX, cY);
        return new Point(cX + x * scaler, cY + y * scaler);
    }

    #filter(polys) {
        const filteredPolys = [];
        for (const poly of polys) {
            if (Array.isArray(poly)) {
                continue
            }

            if (poly.intersectsPoly(this.poly)) {
                const copy1 = new Polygon(poly.points);
                const copy2 = new Polygon(this.poly.points);
                Polygon.break(copy1, copy2, true);
                const points = copy1.segments.map((s) => s.p1);
                const filteredPoints = points.filter(
                    (p) => p.intersection || this.poly.containsPoint(p)
                );
                filteredPolys.push(new Polygon(filteredPoints));
            } else if (this.poly.containsPoly(poly)) {
                filteredPolys.push(poly);
            }
        }
        return filteredPolys;
    }

    #extrude(polys, height = 10) {
        const extrudedPolys = [];
        for (const poly of polys) {
            const ceiling = new Polygon(
                poly.points.map((p) => new Point(p.x, p.y, -height))
            );
            const sides = [];
            for (let i = 0; i < poly.points.length; i++) {
                sides.push(new Polygon([
                    poly.points[i],
                    poly.points[(i + 1) % poly.points.length],
                    ceiling.points[(i + 1) % ceiling.points.length],
                    ceiling.points[i]
                ]));
            }
            extrudedPolys.push(...sides, ceiling);
        }
        return extrudedPolys;
    }

    /** @param {World} world */
    #getPolys(world) {
        const buildingPolys = this.#extrude(this.#filter(
            world.buildings.map((b) => b.base)
        ), 200);

        const roadPolys = this.#extrude(this.#filter(
            world.roadBorders.map((s) => new Polygon([s.p1, s.p2]))
        ), 5);

        const carPolygons = world.cars
            .map((c) => c.polygon)
            .map((p) => new Polygon(p.map((p) => new Point(p.x, p.y))))

        // let bestCar = this.#filter(carPolygons)[0];

        const carPolys = this.#extrudeCar(carPolygons[0], world.cars[0]);


        //
        // const carPolys = this.#extrude(this.#filter(
        //     [carPolygons]
        // ), 10);

        return [...buildingPolys, ...roadPolys, ...carPolys];
    }

    render(ctx, world) {
        const polys = this.#getPolys(world);
        /** @type {Polygon[]} */
        const projPolys = polys.map((poly) => new Polygon(
                poly.points.map((p) => this.#projectPoint(ctx, p))
            )
        );

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (const poly of projPolys) {
            poly.draw(ctx, {fill: "#DDD", stroke: "#555", join: "round"});
        }
    }

    draw(ctx) {
        this.poly.draw(ctx);
    }

    #handleKeyDown(evt) {
        const speed = 10;
        if (evt.key === "w") {
            this.x = this.x - speed * Math.sin(this.angle)
            this.y = this.y - speed * Math.cos(this.angle)
        }
        if (evt.key === "s") {
            this.x = this.x + speed * Math.sin(this.angle)
            this.y = this.y + speed * Math.cos(this.angle)
        }
        if (evt.key === "a") {
            this.moveAngle(this.angle + 0.03)
        }
        if (evt.key === "d") {
            this.moveAngle(this.angle - 0.03)
        }

    }

    #addEventListeners() {
        cameraCanvas.addEventListener("mousedown", this.#handleMouseDown.bind(this));
        cameraCanvas.addEventListener("mousemove", this.#handleMouseMove.bind(this));
        cameraCanvas.addEventListener("mouseup", this.#handleMouseUp.bind(this));
        window.addEventListener("keydown", this.#handleKeyDown.bind(this));
    }

    #handleMouseDown(evt) {
        console.log('mousedown')
        this.drag.start = this.#getMouse(evt);
        this.drag.active = true;
    };

    #handleMouseMove(evt) {
        if (this.drag.active) {
            this.drag.end = this.#getMouse(evt);
            // calculate the angle of the drag
            const newAngle = Math.atan2(
                this.drag.end.y - this.drag.start.y,
                this.drag.end.x - this.drag.start.x
            );
            this.angle -= (this.angle - newAngle) / 10;
        }
    };

    #handleMouseUp(evt) {
        console.log('mouseup')
        this.drag.active = false;
        this.drag.start = new Point(0, 0);
        this.drag.end = new Point(0, 0);
    };

    #getMouse(evt) {
        const p = new Point(
            (evt.offsetX - this.center.x),
            (evt.offsetY - this.center.y)
        );
        return subtract(p, this.drag.offset);
    };



    #extrudeCar(poly, carInfo, height = 15, wheelRadius = 5) {
        const frontRight = new Point(poly.points[0].x, poly.points[0].y);
        const frontLeft = new Point(poly.points[1].x, poly.points[1].y);
        const backLeft = new Point(poly.points[2].x, poly.points[2].y);
        const backRight = new Point(poly.points[3].x, poly.points[3].y);
        const middleLeft = average(frontLeft, backLeft);
        const middleRight = average(frontRight, backRight);
        const quarterFrontLeft = average(frontLeft, middleLeft);
        const quarterBackLeft = average(backLeft, middleLeft);
        const quarterFrontRight = average(frontRight, middleRight);
        const quarterBackRight = average(backRight, middleRight);
        this.#moveInward(frontLeft, frontRight, 0.2);
        this.#moveInward(backLeft, backRight, 0.1);

        const base = new Polygon([
            frontLeft,
            quarterFrontLeft,
            middleLeft,
            quarterBackLeft,
            backLeft,
            backRight,
            quarterBackRight,
            middleRight,
            quarterFrontRight,
            frontRight
        ]);

        for (const point of base.points) {
            point.z -= wheelRadius;
        }

        const ceiling = new Polygon(
            base.points.map((p) => new Point(p.x, p.y, -height))
        );
        const midLine = new Polygon(
            base.points.map((p) => new Point(p.x, p.y, -height / 2))
        );

        const c_frontLeft = ceiling.points[0];
        const c_quarterFrontLeft = ceiling.points[1];
        const c_middleLeft = ceiling.points[2];
        const c_quarterBackLeft = ceiling.points[3];
        const c_backLeft = ceiling.points[4];
        const c_backRight = ceiling.points[5];
        const c_quarterBackRight = ceiling.points[6];
        const c_middleRight = ceiling.points[7];
        const c_quarterFrontRight = ceiling.points[8];
        const c_frontRight = ceiling.points[9];

        c_frontLeft.z += 7;
        c_frontRight.z += 7;
        c_quarterFrontLeft.z += 6;
        c_quarterFrontRight.z += 6;
        c_backLeft.z += 4;
        c_backRight.z += 4;

        this.#moveInward(c_frontLeft, c_frontRight);
        this.#moveInward(c_quarterFrontLeft, c_quarterFrontRight);
        this.#moveInward(c_middleLeft, c_middleRight);
        this.#moveInward(c_quarterBackLeft, c_quarterBackRight);
        this.#moveInward(c_backLeft, c_backRight);
        this.#moveInward(c_frontLeft, c_backLeft, 0.1);
        this.#moveInward(c_frontRight, c_backRight, 0.1);

        const sides = [];
        for (let i = 0; i < base.points.length; i++) {
            sides.push(new Polygon([
                base.points[i],
                base.points[(i + 1) % base.points.length],
                midLine.points[(i + 1) % midLine.points.length],
                midLine.points[i]
            ]));
        }
        for (let i = 0; i < base.points.length; i++) {
            sides.push(new Polygon([
                midLine.points[i],
                midLine.points[(i + 1) % midLine.points.length],
                ceiling.points[(i + 1) % ceiling.points.length],
                ceiling.points[i]
            ]));
        }

        const ceilingParts = [];

        ceilingParts.push(new Polygon([
            c_frontLeft,
            c_quarterFrontLeft,
            c_quarterFrontRight,
            c_frontRight
        ]));
        ceilingParts.push(new Polygon([
            c_quarterFrontLeft,
            c_middleLeft,
            c_middleRight,
            c_quarterFrontRight
        ]));
        ceilingParts.push(new Polygon([
            c_middleLeft,
            c_quarterBackLeft,
            c_quarterBackRight,
            c_middleRight
        ]));
        ceilingParts.push(new Polygon([
            c_quarterBackLeft,
            c_backLeft,
            c_backRight,
            c_quarterBackRight
        ]));

        const carAngle = Math.atan2(
            frontLeft.y - backLeft.y,
            frontLeft.x - backLeft.x
        );

        let frontWheelAngle = carAngle;
        // if (carInfo.controls.tilt) {
        //     frontWheelAngle += carInfo.controls.tilt * 0.5;
        // } else {
        //     if (carInfo.controls.left) {
        //         frontWheelAngle -= 0.3;
        //     }
        //     if (carInfo.controls.right) {
        //         frontWheelAngle += 0.3;
        //     }
        // }

        const frontWheelLeftPolys = this.#generateWheel(
            quarterFrontLeft,
            wheelRadius,
            frontWheelAngle,
            carInfo.fittness
        );
        const frontWheelRightPolys = this.#generateWheel(
            quarterFrontRight,
            wheelRadius,
            frontWheelAngle,
            carInfo.fittness
        );
        const backWheelLeftPolys = this.#generateWheel(
            quarterBackLeft,
            wheelRadius,
            carAngle,
            carInfo.fittness
        );
        const backWheelRightPolys = this.#generateWheel(
            quarterBackRight,
            wheelRadius,
            carAngle,
            carInfo.fittness
        );

        return [
            ...frontWheelLeftPolys,
            ...frontWheelRightPolys,
            ...backWheelLeftPolys,
            ...backWheelRightPolys,
            ...sides,
            ...ceilingParts
        ];
    }

    #generateWheel(center, radius, angle, distance = 0, thickness = 4) {
        const center1 = new Point(
            center.x + Math.cos(angle + Math.PI / 2) * thickness / 2,
            center.y + Math.sin(angle + Math.PI / 2) * thickness / 2,
            center.z
        );
        const center2 = new Point(
            center.x - Math.cos(angle + Math.PI / 2) * thickness / 2,
            center.y - Math.sin(angle + Math.PI / 2) * thickness / 2,
            center.z
        );

        const poly1 = this.#generateWheelSide(center1, radius, angle, distance);
        const poly2 = this.#generateWheelSide(center2, radius, angle, distance);

        const sides = [];
        for (let i = 0; i < poly1.points.length; i++) {
            sides.push(
                new Polygon([
                    poly1.points[i],
                    poly1.points[(i + 1) % poly1.points.length],
                    poly2.points[(i + 1) % poly2.points.length],
                    poly2.points[i]
                ])
            );
        }

        return [poly1, poly2, ...sides];
    }

    #generateWheelSide(center, radius, angle, distance) {
        const support = [
            center,
            new Point(
                center.x + Math.cos(angle) * radius,
                center.y + Math.sin(angle) * radius,
                center.z
            )
        ];
        const points = [];
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
            const angle = a + distance / 20;
            points.push(
                new Point(
                    lerp(support[0].x, support[1].x, Math.cos(angle)),
                    lerp(support[0].y, support[1].y, Math.cos(angle)),
                    center.z + Math.sin(angle) * radius
                )
            );
        }
        return new Polygon(points);
    }

    #moveInward(p1, p2, percent = 0.3) {
        const new_p1 = lerp2D(p1, p2, percent);
        const new_p2 = lerp2D(p2, p1, percent);
        p1.x = new_p1.x;
        p1.y = new_p1.y;
        p2.x = new_p2.x;
        p2.y = new_p2.y;
    }
}