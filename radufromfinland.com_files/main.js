function generateCarInspector(index) {
    const c3Margin = 20;
    const container = document.createElement("div");
    const c3 = document.createElement("canvas");
    c3.height = rightBarWidth;
    c3.width = rightBarWidth;
    c3.style.borderRadius = "50%";
    c3.style.border = "2px solid green";
    c3.style.margin = c3Margin + "px";
    c3.style.backgroundColor = "#333";

    miniMap = new MiniMap(c3, world.graph, rightBarWidth - c3Margin * 2);
    miniMap.targets = targets;

    const d = document.createElement("div");
    const db = new MultiDecisionBoundary(d, cars[index].nn, outputColors);

    container.appendChild(nnCanvas);
    container.appendChild(c3);

    container.style.marginRight = "5px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.backgroundColor = "#222";

    inspectionSection.appendChild(container);
    decisionBoundaries.push(db);

    nnViewport = new Viewport(nnCanvas, 1, null, false, false);

}

function generateCars(N, markings) {
    const cars = [];
    let i = 0;
    while (i < N) {
        const {center, directionVector, width, height} = markings[i % markings.length];
        const alpha = -angle(directionVector);
        cars.push(new Car(center.x, center.y, alpha, {
                ...defaultOptions, //,
                //maxSpeed,
                color: carColors[i % carColors.length],
            })
        );
        i++;
    }
    return cars;
}

function animate(time) {
    lastLoop = new Date();
    viewport.reset();

    lightBorders = world.markings
        .filter((m) => m instanceof Light && (m.state == "red" || m.state == "yellow"))
        .map((s) => [s.border.p1, s.border.p2]);


    if (!optimizing) {
        for (let i = 0; i < cars.length - 1; i++) {
            for (let j = i + 1; j < cars.length; j++) {
                if (!cars[i].invulnerable && !cars[j].invulnerable && cars[i].state != "helicopter" && cars[j].state != "helicopter") {
                    if (polysIntersect(cars[i].polygon, cars[j].polygon)) {
                        cars[i].damaged = true;
                        cars[j].damaged = true;
                        cars[i].activateRespaunSequence();
                        cars[j].activateRespaunSequence();
                    }
                }
            }
        }
    }
    let bestI = -1;
    let bestFittness = 0;
    for (let i = 0; i < cars.length; i += carMarkings.length) {
        let fittness = cars[i].fittness;
        let allAlive = !cars[i].damaged;
        let allStopped = cars[i].speed == 0;
        for (let j = 1; j < carMarkings.length && i + j < cars.length; j++) {
            fittness += cars[i + j].fittness;
            allAlive &= !cars[i + j].damaged;
            allStopped &= cars[i + j].speed == 0;
        }
        if (allAlive && (allStopped || stopForFittness == false)) {
            if (fittness > bestFittness) {
                bestFittness = fittness;
                bestI = i;
            }
        }
    }

    if (bestI != -1) {
        for (
            let j = 0;
            j < carMarkings.length && j + bestI < cars.length;
            j++
        ) {
            cars[bestI + j].marked = true;
        }
    }
    const viewPoint = scale(viewport.getOffset(), -1);
    const regScaler = showGrid ? 1 : 2;
    const regionWidth = carCanvas.width * regScaler;
    const regionHeight = carCanvas.height * regScaler;
    const activeRegion = new Polygon([
        new Point(
            viewPoint.x - regionWidth / 2,
            viewPoint.y - regionHeight / 2
        ),
        new Point(
            viewPoint.x - regionWidth / 2,
            viewPoint.y + regionHeight / 2
        ),
        new Point(
            viewPoint.x + regionWidth / 2,
            viewPoint.y + regionHeight / 2
        ),
        new Point(
            viewPoint.x + regionWidth / 2,
            viewPoint.y - regionHeight / 2
        ),
    ]);

    miniMap.update(viewPoint);
    world.draw(carCtx, viewPoint, false, activeRegion, optimizing);
    nnViewport.reset();

    requestAnimationFrame(animate);
}

function assignPath(cars, target) {
    for (const car of cars) {
        if (car.state == "car" || car.onRoad) {
            car.segment = getNearestSegment(car, world.graph.segments);
            car.destination = target;
            const segments = world.generateShortestPathBorders(car, target.center);
            car.assignedBorders = segments;
        }
    }
}

function giveAllPaths() {
    if (targets.length == 0) {
        return;
    }

    for (let i = cars.length - 1; i >= 0; i--) {
        let targetIndex = 0;
        switch (i) {
            case 0:
                targetIndex = 0;
                break;
            case 1:
                targetIndex = 5;
                break;
            case 2:
                targetIndex = 4;
                break;
            case 3:
                targetIndex = 6;
                break;
        }
        cars[i].polygon = cars[i].createPolygon();
        cars[i].segment = getNearestSegment(cars[i], world.graph.segments);
        cars[i].assignedBorders = world.generateShortestPathBorders(
            cars[i],
            targets[targetIndex].center
        );
        cars[i].destination = targets[targetIndex];
    }
}
