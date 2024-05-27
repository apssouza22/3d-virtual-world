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

    /**
     * Projects a 3D point to a 2D canvas point.
     *
     * @param ctx
     * @param {Point} p
     * @returns {Point}
     */
    #projectPoint(ctx, p) {
        const seg = new Segment(this.center, this.tip);
        const {point: p1} = seg.projectPoint(p);
        // This line calculates the cross product of two vectors:
        // one from the camera to the projected point p1, and one from the camera to the original point p. The cross product is a measure of the area of the parallelogram formed by the two vectors, and its sign indicates the direction of rotation from the first vector to the second.
        const c = cross(subtract(p1, this), subtract(p, this));
        // This line calculates the x-coordinate of the projected point on the 2D canvas.
        // It's based on the distance from the original point p to the projected point p1, scaled by the distance from the camera to p1.
        // The Math.sign(c) term ensures that the x-coordinate has the correct sign based on the direction of rotation calculated earlier.
        const x = Math.sign(c) * distance(p, p1) / distance(this, p1);
        //This line calculates the y-coordinate of the projected point on the 2D canvas. It's based on the difference in z-coordinates between the original point p and the camera, scaled by the distance from the camera to p1.
        const y = (p.z - this.z) / distance(this, p1);

        const cX = ctx.canvas.width / 2;
        const cY = ctx.canvas.height / 2;
        const scaler = Math.max(cX, cY);
        //This line calculates the final coordinates of the projected point on the 2D canvas, and returns a new Point object with these coordinates. The x and y coordinates are calculated by adding the scaled x and y values to the center of the canvas.
        return new Point(cX + x * scaler, cY + y * scaler);
    }


    /**
     * Filters out polygons that are not visible to the camera
     *
     * @param {Polygon[]} polys
     * @returns {Polygon[]} The visible polygons
     */
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
                continue
            }

            if (this.poly.containsPoly(poly)) {
                filteredPolys.push(poly);
            }
        }
        return filteredPolys;
    }

    /**
     * Extrusion is the process of stretching a flat, 2D shape vertically to create a 3D object in a scene.
     * For example, you can extrude building polygons by a height value to create three-dimensional building shapes.
     *
     * @param {Polygon[]} polys
     * @param  {number} height The height of the extrusion
     * @returns {Polygon[]} The extruded polygons
     */
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

    /**
     * Get extruded items.
     *
     * @param {World} world
     * @returns {Polygon[]}
     * */
    #getExtrudedItems(world) {
        const buildingPolys = this.#extrudeItems(world.buildings, 200);
        const cars = [...world.cars]
        const firstCar = cars.shift()

        const carPolys = this.#extrudeItems(cars, 10);
        const roadPolys = this.#extrudeItems(
            world.roadBorders.map(s => new WorldItem(new Polygon([s.p1, s.p2]))),
            5
        );
        const car3DPolys = new Car3d().extrude(firstCar.poly());
        return [...buildingPolys, ...roadPolys, ...carPolys, ...car3DPolys];
    }

    /**
     * Extrude world items
     *
     * @param {WorldItem[]} items
     * @param height
     * @returns {Polygon[]}
     */
    #extrudeItems(items, height = 10) {
        let visiblePolys = this.#filter(
            items.map((b) => b.poly())
        );
        return this.#extrude(visiblePolys, height);
    }

    render(ctx, world) {
        const polys = this.#getExtrudedItems(world);
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


}