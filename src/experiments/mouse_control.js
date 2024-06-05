
class MouseControl{
    constructor(canvas) {
        this.canvas = canvas;
        this.offsetScale = 0.01;
        this.center = new Point(canvas.width / 2, canvas.height / 2);
        this.offset = scalePoint(this.center, -1);

        this.drag = {
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0),
            active: false,
        };

        this.#addPanEventListeners();
    }


    getMouse(evt) {
        const p = new Point(
            (evt.offsetX - this.center.x),
            (evt.offsetY - this.center.y),
            0,
            false
        );
        return p;
    }

    #addPanEventListeners() {
        this.canvas.addEventListener("mousedown", this.#handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.#handleMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.#handleMouseUp.bind(this));
    }

    #handleMouseDown(evt) {
        this.drag.start = this.getMouse(evt);
        this.drag.active = true;
    }

    #handleMouseMove(evt) {
        if (this.drag.active) {
            this.drag.end = this.getMouse(evt);
            this.drag.offset = scalePoint(subtractPoint(this.drag.end, this.drag.start), this.offsetScale);
        }
    }

    #handleMouseUp(evt) {
        if (this.drag.active) {
            this.offset = addPoint(this.offset, this.drag.offset);
            this.drag = {
                start: new Point(0, 0),
                end: new Point(0, 0),
                offset: new Point(0, 0),
                active: false,
            };
        }
    }
}

function scalePoint(p, scaler) {
    return new Point(p.x * scaler, p.y * scaler, 0, false);
}


function addPoint(p1, p2, round = true) {
    return new Point(p1.x + p2.x, p1.y + p2.y, round);
}

function subtractPoint(p1, p2) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
}