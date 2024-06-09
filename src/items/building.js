class Building extends WorldItem {

    /**
     *
     * @param {Polygon}poly
     * @param height
     */
    constructor(poly, height = 200) {
        super();
        this.base = poly;
        this.height = height;
        this.imgOffset = new Point(0, 0);
        this.imgScaler = 1;
        this.base.simplify();
    }

    poly() {
        return this.base;
    }

    static load(info, index) {
        const b = new Building(Polygon.load(info.base), info.height);
        b.id = index;
        if (info.id) {
            b.id = info.id;
        }
        b.base.simplify();
        return b;
    }

    update(viewPoint) {
        const topPoints = this.base.points.map((p) =>
            getFake3dPoint(p, viewPoint, this.height * 0.6)
        );
        const ceiling = new Polygon(topPoints);
        ceiling.base = this.base;

        if (this.img) {
            this.#addImageToCeiling(ceiling, viewPoint);
        }

        const sides = this.#getSides(topPoints);
        let roofPolys = this.#getRoofs(ceiling, viewPoint);
        return {ceiling, sides, roofPolys};
    }

    #getRoofs(ceiling, viewPoint) {
        let roofPolys = [];
        if (!this.#isHouse()) {
            return roofPolys;
        }
        ceiling.dark = true;
        const baseMidpoints = [
            average(this.base.points[0], this.base.points[1]),
            average(this.base.points[2], this.base.points[3]),
        ];

        const topMidpoints = baseMidpoints.map((p) =>
            getFake3dPoint(p, viewPoint, this.height)
        );

        roofPolys = [
            new Polygon([
                ceiling.points[0],
                ceiling.points[3],
                topMidpoints[1],
                topMidpoints[0],
            ]),
            new Polygon([
                ceiling.points[2],
                ceiling.points[1],
                topMidpoints[0],
                topMidpoints[1],
            ]),
        ];
        roofPolys.sort((a, b) => b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint));
        return roofPolys;
    }

    #isHouse() {
        return this.base.points.length === 4 || this.base.points.length === 5;
    }

    #addImageToCeiling(ceiling, viewPoint) {
        ceiling.img = this.img;
        ceiling.imgOffset = this.imgOffset;
        ceiling.imgScaler = this.imgScaler;

        const minX = Math.min(...this.base.points.map((p) => p.x));
        const maxX = Math.max(...this.base.points.map((p) => p.x));
        const minY = Math.min(...this.base.points.map((p) => p.y));
        const maxY = Math.max(...this.base.points.map((p) => p.y));
        const center = add(ceiling.imgOffset, new Point((minX + maxX) / 2, (minY + maxY) / 2));
        ceiling.imgLoc = getFake3dPoint(center, viewPoint, this.height * 0.6);

        let rad = Number.MAX_SAFE_INTEGER;

        for (const seg of this.base.segments) {
            const d = seg.distanceToPoint(center);
            if (d < rad) {
                rad = d;
            }
        }
        rad /= Math.sqrt(2);
        rad *= 0.8;
        ceiling.imgSize = rad * 2 * ceiling.imgScaler;
    }

    #getSides(topPoints) {
        const sides = [];
        for (let i = 0; i < this.base.points.length; i++) {
            const nextI = (i + 1) % this.base.points.length;
            const poly = new Polygon([
                this.base.points[i],
                this.base.points[nextI],
                topPoints[nextI],
                topPoints[i],
            ]);
            sides.push(poly);
        }
        return sides;
    }

    draw(ctx, viewPoint) {
        const topPoints = this.base.points.map((p) =>
            getFake3dPoint(p, viewPoint, this.height * 0.6)
        );
        const ceiling = new Polygon(topPoints);

        const sides = [];
        for (let i = 0; i < this.base.points.length; i++) {
            const nextI = (i + 1) % this.base.points.length;
            const poly = new Polygon([
                this.base.points[i],
                this.base.points[nextI],
                topPoints[nextI],
                topPoints[i],
            ]);
            sides.push(poly);
        }
        sides.sort(
            (a, b) => b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
        );

        /*
        const baseMidpoints = [
           average(this.base.points[0], this.base.points[1]),
           average(this.base.points[2], this.base.points[3])
        ];

        const topMidpoints = baseMidpoints.map((p) =>
           getFake3dPoint(p, viewPoint, this.height)
        );

        const roofPolys = [
           new Polygon([
              ceiling.points[0], ceiling.points[3],
              topMidpoints[1], topMidpoints[0]
           ]),
           new Polygon([
              ceiling.points[2], ceiling.points[1],
              topMidpoints[0], topMidpoints[1]
           ])
        ];
        roofPolys.sort(
           (a, b) =>
              b.distanceToPoint(viewPoint) -
              a.distanceToPoint(viewPoint)
        );
        */
        this.base.draw(ctx, {
            fill: "gray",
            stroke: "rgba(0,0,0,0.2)",
            lineWidth: 20,
        });
        for (const side of sides) {
            side.draw(ctx, {fill: "#999", stroke: "#555", join: "round"});
        }
        ceiling.draw(ctx, {fill: "#DDD", stroke: "#555", join: "round"});
        /*
        for (const poly of roofPolys) {
           poly.draw(ctx, { fill: "#D44", stroke: "#C44", lineWidth: 8, join: "round" });
        }*/
    }
}
