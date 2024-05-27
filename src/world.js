class World {
    constructor(
        graph,
        roadWidth = 100,
        roadRoundness = 10,
        buildingWidth = 150,
        buildingMinLength = 150,
        spacing = 50,
        treeSize = 160
    ) {
        this.graph = graph;
        this.roadWidth = roadWidth;
        this.roadRoundness = roadRoundness;
        this.buildingWidth = buildingWidth;
        this.buildingMinLength = buildingMinLength;
        this.spacing = spacing;
        this.treeSize = treeSize;
        this.frameCount = 100;

        this.drawContents = ["envelopes", "items", "3d", "markings"];
        /** @type {Envelope[]} */
        this.envelopes = [];
        /** @type {Segment[]} */
        this.roadBorders = [];
        /** @type {Building[]} */
        this.buildings = [];
        /** @type {Tree[]} */
        this.trees = [];
        /** @type {Segment[]} */
        this.laneGuides = [];
        /** @type {Marking[]} */
        this.markings = [];
        /** @type {Car[]} */
        this.cars = [];
        /** @type {Water} */
        this.water = null;

        this.generate();
    }

    static load(info) {
        const world = new World(new Graph());
        world.graph = Graph.load(info.graph);
        world.roadWidth = info.roadWidth;
        world.roadRoundness = info.roadRoundness;
        world.buildingWidth = info.buildingWidth;
        world.buildingMinLength = info.buildingMinLength;
        world.spacing = info.spacing;
        world.treeSize = info.treeSize;
        world.envelopes = info.envelopes.map((e) => Envelope.load(e));
        if (info.roadBorders) {
            world.roadBorders = info.roadBorders
                .map((b) => new Segment(
                        new Point(b.p1.x, b.p1.y),
                        new Point(b.p2.x, b.p2.y),
                        b.oneWay,
                        b.layer
                    )
                );
        } else {
            world.roadBorders = info.roadPoly.segments.map((b) => new Segment(
                    new Point(b.p1.x, b.p1.y),
                    new Point(b.p2.x, b.p2.y)
                )
            );
        }
        world.buildings = info.buildings.map((e, index) => Building.load(e, index));
        world.trees = info.trees.map((t) => new Tree(t.center, info.treeSize));
        world.laneGuides = info.laneGuides
            .map((b) => new Segment(
                new Point(b.p1.x, b.p1.y),
                new Point(b.p2.x, b.p2.y)
            ));
        world.markings = info.markings.map((m) => Marking.load(m));
        try {
            world.water = Water.load(info.water);
        } catch (err) {
        }
        world.zoom = info.zoom;
        world.offset = info.offset;
        world.grid = info.grid;

        return world;
    }


    generate() {
        this.envelopes.length = 0;
        for (const seg of this.graph.segments) {
            const e = new Envelope(seg, this.roadWidth, this.roadRoundness);
            e.layer = seg.layer;
            this.envelopes.push(e);
        }

        const layer0 = Polygon.union(
            this.envelopes.filter((e) => e.layer != 1).map((e) => e.poly)
        );
        const layer1 = Polygon.union(
            this.envelopes.filter((e) => e.layer == 1).map((e) => e.poly)
        );
        for (const seg of layer1) {
            seg.layer = 1;
        }
        this.roadBorders = [...layer0, ...layer1];
        this.buildings = this.#generateBuildings();
        this.trees = this.#generateTrees();
        this.laneGuides.length = 0;
        this.laneGuides.push(...this.#generateLaneGuides());
        this.intersections = null;
    }

    #generateLaneGuides() {
        const tmpEnvelopes = [];
        for (const seg of this.graph.segments) {
            tmpEnvelopes.push(
                new Envelope(seg, this.roadWidth / 2, this.roadRoundness)
            );
        }
        const segments = Polygon.union(tmpEnvelopes.map((e) => e.poly));
        return segments;
    }

    #generateTrees() {
        const points = [
            ...this.roadBorders.map((s) => [s.p1, s.p2]).flat(),
            ...this.buildings.map((b) => b.base.points).flat(),
        ];
        const left = Math.min(...points.map((p) => p.x));
        const right = Math.max(...points.map((p) => p.x));
        const top = Math.min(...points.map((p) => p.y));
        const bottom = Math.max(...points.map((p) => p.y));

        const illegalPolys = [
            ...this.buildings.map((b) => b.base),
            ...this.envelopes.map((e) => e.poly),
        ];
        if (this.water) {
            illegalPolys.push(...this.water.polys);
        }

        const trees = [];
        let tryCount = 0;
        while (tryCount < 50) {
            const p = new Point(
                lerp(left, right, Math.random()),
                lerp(bottom, top, Math.random())
            );

            // check if tree inside or nearby building / road
            let keep = true;
            for (const poly of illegalPolys) {
                if (
                    poly.containsPoint(p) ||
                    poly.distanceToPoint(p) < this.treeSize / 2
                ) {
                    keep = false;
                    break;
                }
            }
            if (keep == false && this.water) {
                for (const poly of this.water.innerPolys) {
                    if (
                        poly.containsPoint(p) ||
                        poly.distanceToPoint(p) < this.treeSize / 2
                    ) {
                        keep = true;
                        break;
                    }
                }
            }

            // check if tree too close to other trees
            if (keep) {
                for (const tree of trees) {
                    if (distance(tree.center, p) < this.treeSize) {
                        keep = false;
                        break;
                    }
                }
            }

            // avoiding trees in the middle of nowhere
            if (keep) {
                let closeToSomething = false;
                for (const poly of illegalPolys) {
                    if (poly.distanceToPoint(p) < this.treeSize * 2) {
                        closeToSomething = true;
                        break;
                    }
                }
                keep = closeToSomething;
            }

            if (keep) {
                trees.push(new Tree(p, this.treeSize));
                tryCount = 0;
            }
            tryCount++;
        }
        return trees;
    }

    #generateBuildings() {
        const tmpEnvelopes = [];
        for (const seg of this.graph.segments) {
            tmpEnvelopes.push(
                new Envelope(
                    seg,
                    this.roadWidth + this.buildingWidth + this.spacing * 2,
                    this.roadRoundness
                )
            );
        }

        const guides = Polygon.union(tmpEnvelopes.map((e) => e.poly));

        for (let i = 0; i < guides.length; i++) {
            const seg = guides[i];
            if (seg.length() < this.buildingMinLength) {
                guides.splice(i, 1);
                i--;
            }
        }

        const supports = [];
        for (let seg of guides) {
            const len = seg.length() + this.spacing;
            const buildingCount = Math.floor(
                len / (this.buildingMinLength + this.spacing)
            );
            const buildingLength = len / buildingCount - this.spacing;

            const dir = seg.directionVector();

            let q1 = seg.p1;
            let q2 = add(q1, scale(dir, buildingLength));
            supports.push(new Segment(q1, q2));

            for (let i = 2; i <= buildingCount; i++) {
                q1 = add(q2, scale(dir, this.spacing));
                q2 = add(q1, scale(dir, buildingLength));
                supports.push(new Segment(q1, q2));
            }
        }

        const bases = [];
        for (const seg of supports) {
            bases.push(new Envelope(seg, this.buildingWidth).poly);
        }

        const eps = 0.001;
        for (let i = 0; i < bases.length - 1; i++) {
            for (let j = i + 1; j < bases.length; j++) {
                if (
                    bases[i].intersectsPoly(bases[j]) ||
                    bases[i].distanceToPoly(bases[j]) < this.spacing - eps
                ) {
                    bases.splice(j, 1);
                    j--;
                }
            }
        }

        return bases.map((b) => new Building(b));
    }

    #getIntersections() {
        const subset = [];
        for (const point of this.graph.points) {
            let degree = 0;
            for (const seg of this.graph.segments) {
                if (seg.includes(point)) {
                    degree++;
                }
            }

            if (degree > 2) {
                subset.push(point);
            }
        }
        return subset;
    }

    #updateLights() {
        if (this.intersections == null) {
            this.intersections = this.#getIntersections();
        }
        const lights = this.markings.filter((m) => m instanceof Light);
        const controlCenters = [];
        for (const light of lights) {
            const point = getNearestPoint(light.center, this.intersections);
            let controlCenter = controlCenters.find((c) => c.equals(point));
            if (!controlCenter) {
                controlCenter = new Point(point.x, point.y);
                controlCenter.lights = [light];
                controlCenters.push(controlCenter);
            } else {
                controlCenter.lights.push(light);
            }
        }
        const greenDuration = 2,
            yellowDuration = 1;
        for (const center of controlCenters) {
            center.ticks = center.lights.length * (greenDuration + yellowDuration);
        }
        const tick = Math.floor(this.frameCount / 60);
        for (const center of controlCenters) {
            const cTick = tick % center.ticks;
            const greenYellowIndex = Math.floor(
                cTick / (greenDuration + yellowDuration)
            );
            const greenYellowState =
                cTick % (greenDuration + yellowDuration) < greenDuration
                    ? "green"
                    : "yellow";
            for (let i = 0; i < center.lights.length; i++) {
                if (i == greenYellowIndex) {
                    center.lights[i].state = greenYellowState;
                } else {
                    center.lights[i].state = "red";
                }
            }
        }
        this.frameCount++;
    }

    draw3dItems(ctx, viewPoint, buildings, trees) {
        const allCeilings = [];
        const allRoofPolys = [];
        const allSides = [];
        const allBases = [];
        const treeBases = [];
        for (const b of buildings) {
            if (!b) {
                continue;
            }
            const {ceiling, sides, roofPolys} = b.update(viewPoint);
            allSides.push(...sides);
            allBases.push(b.base);
            allCeilings.push(ceiling);
            allRoofPolys.push(...roofPolys);
        }

        for (const t of trees) {
            treeBases.push(t.base);
        }

        if (this.drawContents.includes("3d")) {
            for (const b of allBases) {
                b.draw(ctx, {
                    fill: "rgba(0,0,0,0)",
                    stroke: "rgba(0,0,0,0.2)",
                    lineWidth: 10,
                });
                if (b.floorPlan) {
                    ctx.drawImage(
                        b.floorPlan,
                        b.floorPlanLoc.x + b.floorPlanOffset.x - b.floorPlanSize / 2,
                        b.floorPlanLoc.y + b.floorPlanOffset.y - b.floorPlanSize / 2,
                        b.floorPlanSize,
                        b.floorPlanSize
                    );
                    //ctx.drawImage(c.img,center.x,center.y,100,100);
                    //center.draw(ctx);
                }
            }
        } else {
            for (const b of allBases) {
                b.draw(ctx, {
                    fill: "#DDD",
                    stroke: "#555",
                });
            }
            for (const t of treeBases) {
                t.draw(ctx, {
                    fill: "#4F9",
                    stroke: "green",
                });
            }
        }

        if (this.drawContents.includes("3d")) {
            for (const s of allSides) {
                s.base = s.segments[0];
            }
            const items = [...allSides, ...trees];
            //this.items=items;
            items.sort(
                (a, b) =>
                    b.base.distanceToPoint(viewPoint) -
                    a.base.distanceToPoint(viewPoint)
            );
            allRoofPolys.sort(
                (a, b) =>
                    b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
            );
            for (const item of items) {
                if (item instanceof Tree) {
                    item.draw(ctx, viewPoint);
                } else {
                    //side
                    item.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#555",
                        join: "round",
                    });
                }
            }

            for (const c of allCeilings) {

                if (c.dark) {
                    c.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#BBB",
                        join: "round",
                        lineWidth: 6,
                    });
                } else {
                    c.draw(ctx, {
                        fill: "#DDD",
                        stroke: "#555",
                        join: "round",
                    });

                }

                if (c.img) {
                    ctx.drawImage(
                        c.img,
                        c.imgLoc.x - c.imgSize / 2,
                        c.imgLoc.y - c.imgSize / 2,
                        c.imgSize,
                        c.imgSize
                    );
                }
                ctx.globalAlpha = 1;
            }

            for (const poly of allRoofPolys) {
                poly.draw(ctx, {
                    fill: "#E88",
                    stroke: "#555",
                    lineWidth: 6,
                    join: "round",
                });
                poly.draw(ctx, {
                    fill: "#E88",
                    stroke: "#E88",
                    lineWidth: 2,
                    join: "round",
                });
            }
        }
    }

    #drawCars(ctx) {
        for (const car of this.cars) {
            car.draw(ctx);
        }
    }

    draw(
        ctx,
        viewPoint,
        showStartMarkings = true,
        activeRegion,
        optimizing = false,
        useGrid = true
    ) {
        this.#updateLights();

        if (this.water) {
            this.water.draw(ctx);
        }

        //ctx.globalAlpha=0.5;
        if (!this.grid || useGrid == false) {
            this.#drawCars(ctx, optimizing, null, true);
            if (this.drawContents.includes("envelopes")) {
                for (const env of this.envelopes) {
                    env.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#BBB",
                        lineWidth: 15,
                    });
                }
            }
            if (this.drawContents.includes("markings")) {
                for (const marking of this.markings) {
                    if (
                        !(marking instanceof Start || marking instanceof Target) ||
                        showStartMarkings
                    ) {
                        marking.draw(ctx);
                    }
                }
            }
            if (this.drawContents.includes("envelopes")) {
                for (const seg of this.graph.segments) {
                    seg.draw(ctx, {color: "white", width: 4, dash: [10, 10]});
                }
                for (const seg of this.roadBorders) {
                    seg.draw(ctx, {color: "white", width: 4});
                }
            }

            this.#drawCars(ctx, optimizing, null);

            if (this.drawContents.includes("items")) {
                const rad = 3000;
                const buildings = this.buildings.filter(
                    (b) => b.base.distanceToPoint(viewPoint) < rad
                );
                const trees = this.trees.filter(
                    (b) => b.base.distanceToPoint(viewPoint) < rad
                );

                this.draw3dItems(ctx, viewPoint, buildings, trees);
            }

            if (this.drawContents.includes("envelopes")) {
                for (const seg of this.graph.segments.filter((e) => e.layer == 1)) {
                    if (!seg) {
                        continue
                    }
                    seg.draw(ctx, {
                        color: "#BBB",
                        width: this.roadWidth + 15,
                    });
                }

                for (const seg of this.graph.segments.filter((b) => b.layer == 1)) {
                    if (!seg) {
                        continue
                    }
                    seg.draw(ctx, {color: "white", width: 4, dash: [10, 10]});
                }

                for (const seg of this.roadBorders.filter((b) => b.layer == 1)) {
                    if (!seg) {
                        continue
                    }
                    seg.draw(ctx, {color: "white", width: 4});
                }
            }

            this.#drawCars(ctx, optimizing, 1);
        } else {
            const data = grid.getDataFromCellsInActiveRegion(activeRegion);
            this.#drawCars(ctx, optimizing, null, true);

            if (this.drawContents.includes("envelopes")) {
                for (const env of data.envelopes) {
                    env.draw(ctx, {
                        fill: "#BBB",
                        stroke: "#BBB",
                        lineWidth: 15,
                    });
                }
            }

            if (this.drawContents.includes("markings")) {
                for (const marking of data.markings) {
                    if (!marking) {
                        continue
                    }
                    if (!(marking instanceof Start || marking instanceof Target) || showStartMarkings
                    ) {
                        marking.draw(ctx);
                    }
                }
            }

            if (this.drawContents.includes("envelopes")) {
                for (const seg of data.graphSegments) {
                    if (!seg) {
                        continue
                    }
                    seg.draw(ctx, {color: "white", width: 4, dash: [10, 10]});
                }
                for (const seg of data.roadBorders) {
                    if (!seg) {
                        continue
                    }
                    seg.draw(ctx, {color: "white", width: 4});
                }
            }
            this.#drawCars(ctx, optimizing, null);

            if (this.drawContents.includes("items")) {
                this.draw3dItems(ctx, viewPoint, data.buildings, data.trees);
            }

            if (this.drawContents.includes("envelopes")) {
                for (const seg of data.graphSegments.filter((e) => e && e.layer == 1)) {
                    seg.draw(ctx, {
                        color: "#BBB",
                        width: this.roadWidth + 15,
                    });
                }
                for (const seg of data.graphSegments.filter((e) => e && e.layer == 1)) {
                    seg.draw(ctx, {color: "white", width: 4, dash: [10, 10]});
                }
                for (const seg of data.roadBorders.filter((e) => e && e.layer == 1)) {
                    seg.draw(ctx, {color: "white", width: 4});
                }
            }

            this.#drawCars(ctx, optimizing, 1);
        }
    }
}
