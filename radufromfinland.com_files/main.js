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
    Visualizer.decisionBoundary = db;

    nnViewport = new Viewport(nnCanvas, 1, null, false, false);

}

function save() {
    if (!bestCar) {
        alert("All cars are damaged");
    }
    const brainString = JSON.stringify(bestCar.brain);
    localStorage.setItem("bestBrain", brainString);

    const carString = JSON.stringify(bestCar);
    localStorage.setItem("car", carString);
}

function download() {
    const carString = localStorage.getItem("car");
    if (!carString) {
        alert("No car to download");
        return;
    }
    const element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:application/json;charset=utf-8," + encodeURIComponent(carString)
    );
    const fileName = "name.car";
    element.setAttribute("download", fileName);
    element.click();
}

function discard() {
    localStorage.removeItem("bestBrain");
    localStorage.removeItem("car");
    localStorage.removeItem("selectedWeightsAndBiases");
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

    if (followBestCar) {
        if (followBestCar instanceof Car) {
            viewport.offset = scale(followBestCar, -1);
        } else {
            viewport.offset = scale(bestCar, -1);
        }
    }
    viewport.reset();

    lightBorders = world.markings
        .filter((m) => m instanceof Light && (m.state == "red" || m.state == "yellow"))
        .map((s) => [s.border.p1, s.border.p2]);

    for (let i = 0; i < cars.length; i++) {
        let minDist = Number.MAX_SAFE_INTEGER;
        let nearest = null;
        for (const t of targets) {
            const d = distance(t.center, cars[i]);
            if (d < minDist) {
                minDist = d;
                nearest = t;
            }
        }

        //keep car layers not 1 layer

        const segs = world.getNearestGraphSegments(cars[i]);
        if (
            !cars[i].segment ||
            segs.filter((s) => s.equals(cars[i].segment)).length == 0
        ) {
            cars[i].segment = segs[0];
        }
        if (segs.length > 0 && !segs[0].equals(cars[i].segment)) {
            if (cars[i].segment.connectedTo(segs[0])) {
                cars[i].segment = segs[0];
                cars[i].layer = segs[0].layer;
            }
        }
        for (const seg of segs) {
            if (seg.connectedTo(cars[i].segment) && seg.layer == 1) {
                cars[i].layer = 1;
            }
        }
        const _borders = world
            .getNearbyRoadBorders(cars[i]) //world.roadBorders
            .filter((b) => b.layer == cars[i].layer)
            .map((s) => [s.p1, s.p2]);

        if (cars[i].state == "boat") {
            cars[i].layer = null;
            _borders.length = 0;
        }
        _borders.push(
            ...world.getNearbyItemBorders(cars[i]).map((s) => [s.p1, s.p2])
        );

        cars[i].onRoad = world.isOnRoad(cars[i]);

        const carBorders = [];
        if (!optimizing) {
            for (let j = 0; j < cars.length; j++) {
                if (j != i) {
                    const c = cars[j];
                    if (!c.invulnerable && c.polygon) {
                        carBorders.push([c.polygon[0], c.polygon[1]]);
                        carBorders.push([c.polygon[1], c.polygon[2]]);
                        carBorders.push([c.polygon[2], c.polygon[3]]);
                        carBorders.push([c.polygon[3], c.polygon[0]]);
                    }
                }
            }
        }

        cars[i].update(
            _borders,
            carBorders,
            stopBorders,
            lightBorders,
            yieldCrossingBorders,
            nearest
        );

        handleEasterEggs(cars[i]);

        if (
            cars[i].destination &&
            distance(cars[i], cars[i].destination.center) < 200
        ) {
            let newTarget =
                targets[Math.floor(Math.random() * targets.length)];
            while (newTarget.center.equals(cars[i].destination.center)) {
                newTarget =
                    targets[Math.floor(Math.random() * targets.length)];
            }
            assignPath([cars[i]], newTarget);
            if (cars[i] == bestCar) {
                goingToSelect.value = newTarget.name;
            }
        }
    }

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
                //if(cars[i].brain.tick==null){
                //cars[i].brain.tick = cars[i].ticks;
                // }
                bestI = i;
            }
        }
    }
    for (let i = 0; i < cars.length; i++) {
        cars[i].marked = false;
    }
    //debugger;
    if (bestI != -1) {
        bestCar = cars[bestI];
        //console.log(bestCar.brain.tick)
        for (
            let j = 0;
            j < carMarkings.length && j + bestI < cars.length;
            j++
        ) {
            cars[bestI + j].marked = true;
        }
    }

    world.cars = cars;
    world.bestCar = bestCar;
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

function loadCar(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (!file) {
        console.error("No file selected.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const fileContent = event.target.result;
        /*const jsonData = JSON.parse(fileContent);
      bestCar.brain = jsonData;*/
        localStorage.setItem("car", fileContent);
        localStorage.removeItem("selectedWeightsAndBiases");
        location.reload();
    };

    reader.readAsText(file);
}

function loadWorld(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (!file) {
        console.error("No file selected.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const fileContent = event.target.result;
        //const jsonData = JSON.parse(fileContent);
        //world.load(jsonData);
        //world.generate(false);
        localStorage.setItem("world", fileContent);
        location.reload();
    };

    reader.readAsText(file);
}

function optimize() {
    localStorage.setItem("optimizing", "on");
    location.reload();
}

function test() {
    location.reload();
}

function updateOptions() {
    let updateBrain = bestCar.sensorOptions.rayCount != Number(rayCount.value);
    if (
        bestCar.sensorOptions.rayCount != Number(rayCount.value) ||
        bestCar.sensorOptions.rayLength != Number(rayLength.value) ||
        bestCar.sensorOptions.raySpread != Number(raySpread.value) ||
        bestCar.sensorOptions.rayOffset != Number(rayOffset.value)
    ) {
        bestCar.sensorOptions.rayCount = Number(rayCount.value);
        bestCar.sensorOptions.rayLength = Number(rayLength.value);
        bestCar.sensorOptions.raySpread = Number(raySpread.value);
        bestCar.sensorOptions.rayOffset = Number(rayOffset.value);
        bestCar.setSensorOptions(bestCar);
    }

    const newOutputs = [];
    if (output_forward.style.backgroundColor == "white") {
        newOutputs.push("🠉");
    }
    if (output_left.style.backgroundColor == "white") {
        newOutputs.push("🠈");
    }
    if (output_right.style.backgroundColor == "white") {
        newOutputs.push("🠊");
    }
    if (output_reverse.style.backgroundColor == "white") {
        newOutputs.push("🠋");
    }

    const newExtraInputs = [];
    if (speedOnOff.checked) {
        newExtraInputs.push("⏱️");
    }
    if (stopOnOff.checked) {
        newExtraInputs.push("🛑");
    }
    if (lightOnOff.checked) {
        newExtraInputs.push("🚦");
    }
    if (targetsOnOff.checked) {
        newExtraInputs.push("🎯"); //!!! REMEMBER IN CAR
    }
    if (crossingOnOff.checked) {
        newExtraInputs.push("🚶");
    }
    if (yieldOnOff.checked) {
        newExtraInputs.push("⚠️");
    }
    if (parkingOnOff.checked) {
        newExtraInputs.push("🅿️");
    }

    let newHiddenLayerNodeCounts = [];
    if (hiddenOnOff.checked) {
        newHiddenLayerNodeCounts = hiddenCount.value
            .split(",")
            .map((s) => Number(s));
    }

    if (
        updateBrain ||
        JSON.stringify(newOutputs) !=
        JSON.stringify(bestCar.brainOptions.outputs) ||
        JSON.stringify(newHiddenLayerNodeCounts) !=
        JSON.stringify(bestCar.brainOptions.hiddenLayerNodeCounts) ||
        JSON.stringify(newExtraInputs) !=
        JSON.stringify(bestCar.brainOptions.extraInputs)
    ) {
        bestCar.brainOptions.hiddenLayerNodeCounts = newHiddenLayerNodeCounts;
        bestCar.brainOptions.outputs = newOutputs;
        bestCar.brainOptions.extraInputs = newExtraInputs;
        bestCar.setBrainOptions(bestCar);
        localStorage.removeItem("selectedWeightsAndBiases");
    }

    bestCar.type = aiOnOff.checked ? "AI" : "KEYS";

    bestCar.autoForward = autoForwardOnOff.checked;

    bestCar.setTypeAndAutoForward(bestCar);

    //bestCar.setSensorAndBrainOptions(bestCar);
    setInterfaceOptions(bestCar);
    save();
    //discard();
    //save();
    location.reload();
}

function zeroBrain() {
    NeuralNetwork.makeZeros(bestCar.brain);
    save();
}

function tryGiveBrain(newBrain) {
    for (let i = 0; i < bestCar.brain.levels.length; i++) {
        for (let j = 0; j < bestCar.brain.levels[i].biases.length; j++) {
            try {
                if (newBrain.levels[i].biases[j]) {
                    bestCar.brain.levels[i].biases[j] =
                        newBrain.levels[i].biases[j];
                } else {
                    throw new Error("not defined");
                }
            } catch (err) {
                bestCar.brain.levels[i].biases[j] = 0;
            }
        }
        for (let j = 0; j < bestCar.brain.levels[i].weights.length; j++) {
            for (
                let k = 0;
                k < bestCar.brain.levels[i].weights[j].length;
                k++
            ) {
                try {
                    if (newBrain.levels[i].weights[j][k]) {
                        bestCar.brain.levels[i].weights[j][k] =
                            newBrain.levels[i].weights[j][k];
                    } else {
                        throw new Error("not defined");
                    }
                } catch (err) {
                    bestCar.brain.levels[i].weights[j][k] = 0;
                }
            }
        }
    }
}

function updateMutation() {
    localStorage.setItem("mutation", mutationSld.value / 100);
}

function changeTarget(el) {
    miniMap.img = new Image();
    const theCars = optimizing ? cars : [bestCar];
    goingToImg.src = miniMap.img.src;
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

function handleEasterEggs(car) {
    if (car.state == "helicopter") {
        return;
    }
    const carPoly = new Polygon(car.polygon)
    let insideWater = false;
    for (const p of world.water.polys) {
        if (p.containsPoly(carPoly)) {
            insideWater = true;
        }
    }
    for (const p of world.water.innerPolys) {
        if (p.containsPoly(carPoly)) {
            insideWater = false;
        }
    }
    if (insideWater) {
        if (car.borderDamaged) {
            if (car.state == "car") {
                car.state = "helicopter";
                car.maxSpeed = 10;
                car.increaseSize();
                return;
            }
        }
        if (!car.onRoad) {
            if (car.state == "car") {
                car.state = "boat";
            }
        }
    } else {
        if (car.state == "boat") {
            car.state = "car";
        }
    }

}
