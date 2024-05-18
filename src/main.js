function generateMiniMap(world) {
    const c3Margin = 20;
    const container = document.createElement("div");
    const minimapCanvas = document.createElement("canvas");

    minimapCanvas.height = rightBarWidth;
    minimapCanvas.width = rightBarWidth;
    minimapCanvas.style.borderRadius = "50%";
    minimapCanvas.style.border = "2px solid green";
    minimapCanvas.style.margin = c3Margin + "px";
    minimapCanvas.style.backgroundColor = "#333";

    container.style.marginRight = "5px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.backgroundColor = "#222";

    miniMap = new MiniMap(minimapCanvas, world.graph, rightBarWidth - c3Margin * 2);
    miniMap.targets = targets;

    container.appendChild(minimapCanvas);
    inspectionSection.appendChild(container);

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
    requestAnimationFrame(animate);
}

function giveAllPaths() {
    if (targets.length == 0) {
        return;
    }

    for (let i = cars.length - 1; i >= 0; i--) {
        let targetIndex = 0;
        cars[i].polygon = cars[i].createPolygon();
        // cars[i].segment = getNearestSegment(cars[i], world.graph.segments);
        // cars[i].assignedBorders = world.generateShortestPathBorders(
        //     cars[i],
        //     targets[targetIndex].center
        // );
        // cars[i].destination = targets[targetIndex];
    }
}
