class Viewport {
    constructor(
        canvas,
        zoom = 1,
        offsetScale = 0.1,
    ) {
        this.canvas = canvas;
        this.offsetScale = offsetScale;
        this.ctx = canvas.getContext("2d");

        this.zoom = zoom
        this.center = new Point(canvas.width / 2, canvas.height / 2);
        this.offset = scale(this.center, -1);

        this.drag = {
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0),
            active: false,
        };

        this.#addPanEventListeners();
        this.#addZoomEventListeners();
    }

    getMouse(evt, subtractDragOffset = false) {
        const p = new Point(
            (evt.offsetX - this.center.x) * this.zoom - this.offset.x,
            (evt.offsetY - this.center.y) * this.zoom - this.offset.y,
            0,
            false
        );
        return subtractDragOffset ? subtract(p, this.drag.offset) : p;
    }

    getOffset() {
        return add(this.offset, this.drag.offset, false);
    }

    #addPanEventListeners() {
        this.canvas.addEventListener("mousedown", this.#handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.#handleMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.#handleMouseUp.bind(this));
    }

    #addZoomEventListeners() {
        this.canvas.addEventListener("mousewheel", this.#handleMouseWheel.bind(this));
    }

    #handleMouseDown(evt) {
        this.drag.start = this.getMouse(evt);
        this.drag.active = true;
    }

    #handleMouseMove(evt) {
        if (this.drag.active) {
            this.drag.end = this.getMouse(evt);
            this.drag.offset = scale(subtract(this.drag.end, this.drag.start), this.offsetScale);
        }
    }

    #handleMouseUp(evt) {
        if (this.drag.active) {
            this.offset = add(this.offset, this.drag.offset);
            this.drag = {
                start: new Point(0, 0),
                end: new Point(0, 0),
                offset: new Point(0, 0),
                active: false,
            };
        }
    }

    #handleMouseWheel(evt) {
        const dir = Math.sign(evt.deltaY);
        const step = 1;
        this.zoom += dir * step;
        this.zoom = Math.max(1, this.zoom);
    }

    update(fn) {
        self = this;

        function render() {
            window.requestAnimationFrame(render);
            if(self.drag.active){
                fn(self.drag.offset.x, self.drag.offset.y);
            }
        }

        render();
    }
}
