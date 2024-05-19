class Viewport {
    constructor(
        canvas,
        zoom = 1,
        offset = null,
        addPanListeners = true,
        addZoomListeners = true,
        panButton = 1
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.maxZoom = 2;
        this.zoom = Math.min(zoom, this.maxZoom);
        this.center = new Point(canvas.width / 2, canvas.height / 2);
        this.offset = offset ? offset : scale(this.center, -1);

        this.drag = {
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0),
            active: false,
        };
        this.panButton = panButton;

        //this.lerpPoints = [];
        this.lerpSteps = 150;
        this.lerpStep = this.lerpSteps;

        this.zoomLerpSteps = 150;
        this.zoomLerpStep = this.zoomLerpSteps;


        if (addPanListeners) {
            this.#addPanEventListeners();
        }
        if (addZoomListeners) {
            this.#addZoomEventListeners();
        }
    }

    zoomInDoubleMax(steps = 20) {
        //copy flyto and change a bit...
        this.zoomTo(0.5, steps)
    }

    zoomIn(steps = 20) {
        //copy flyto and change a bit...
        this.zoomTo(1, steps)
    }

    zoomOut(steps = 20) {
        //copy flyto and change a bit...
        this.zoomTo(this.maxZoom, steps)
    }

    zoomTo(zoomVal, steps) {
        this.lerpZoomStart = this.zoom;
        this.zoomLerpStep = 0;
        //const dist=distance(this.lerpStartPoint,scale(this.lerpEndPoint,-1));
        this.zoomLerpSteps = steps;
        this.lerpZoomEnd = zoomVal;
    }

    flyTo(endPoint, follow = false, zoomEnd = 1, minSteps = 5) {
        this.lerpStartPoint = new Point(this.offset.x, this.offset.y);
        this.lerpStartPoint.follow = follow ? endPoint : follow;
        this.lerpEndPoint = endPoint;
        this.lerpZoomStart = this.zoom;
        this.lerpStep = 0;
        const dist = distance(this.lerpStartPoint, scale(this.lerpEndPoint, -1));
        this.lerpSteps = Math.max(minSteps, Math.floor((dist / 5) ** 0.6))
        this.lerpZoomEnd = zoomEnd;
        this.lerpZoomMid = Math.min(3, this.zoom + Math.floor(this.lerpSteps / 20));
        if (follow == false) {
            followBestCar = false;
        }
        if (!follow) {
            followBtn.style.opacity = 1;
        } else {
            followBtn.style.opacity = 0;
        }
    }

    reset() {
        if (this.lerpStep < this.lerpSteps) {
            this.lerpStep++
            const t = this.lerpStep / this.lerpSteps;
            const tt = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            this.offset = lerp2D(this.lerpStartPoint, scale(this.lerpEndPoint, -1), tt)

            this.zoom = t < 0.5
                ? lerp(this.lerpZoomStart, this.lerpZoomMid, Math.abs(Math.sin(t * Math.PI)))
                : lerp(this.lerpZoomMid, this.lerpZoomEnd, Math.abs(Math.sin((t + 0.5) * Math.PI)));

            if (this.lerpStep == this.lerpSteps) {
                followBestCar = this.lerpStartPoint.follow;
            }
        }
        if (this.zoomLerpStep < this.zoomLerpSteps) {
            this.zoomLerpStep++
            const t = this.zoomLerpStep / this.zoomLerpSteps;
            const tt = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            //this.offset = lerp2D(this.lerpStartPoint, scale(this.lerpEndPoint,-1), tt)

            this.zoom = lerp(this.lerpZoomStart, this.lerpZoomEnd, tt)
            /*if(this.zoomLerpStep==this.zoomLerpSteps){
               followBestCar=this.lerpStartPoint.follow;
            }*/
        }
        this.ctx.restore();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.center.x, this.center.y);
        this.ctx.scale(1 / this.zoom, 1 / this.zoom);
        const offset = this.getOffset();
        this.ctx.translate(offset.x, offset.y);
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
        if (this.lerpStep < this.lerpSteps) {
            return;
        }
        if (evt.button == this.panButton) {
            // middle button
            this.drag.start = this.getMouse(evt);
            this.drag.active = true;
        }
    }

    #handleMouseMove(evt) {

        this.mouse = this.getMouse(evt);
        if (this.lerpStep < this.lerpSteps) {
            return;
        }
        if (this.drag.active) {
            this.drag.end = this.getMouse(evt);
            this.drag.offset = subtract(this.drag.end, this.drag.start);
            followBestCar = false;
            followBtn.style.opacity = 1;
        }
    }

    #handleMouseUp(evt) {
        if (this.lerpStep < this.lerpSteps) {
            return;
        }
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
        if (this.lerpStep < this.lerpSteps) {
            return;
        }
        const dir = Math.sign(evt.deltaY);
        const step = 0.1;
        this.zoom += dir * step;
        this.zoom = Math.max(1, Math.min(this.maxZoom, this.zoom));
    }
}
