class Object3D {

    /**
     * Create a new 3D object
     * @param {Render3D} render
     * @param vertices
     * @param faces
     */
    constructor(render, vertices = [], faces = []) {
        this.render = render;
        this.vertices = vertices;
        this.faces = faces;
        this.translate([0.0001, 0.0001, 0.0001]);

        this.colorFaces = this.faces.map(face => ({color: 'red', face}));
        this.movementFlag = false;
        this.drawVertices = true;
    }

    draw() {
        this.screenProjection();
        this.move();
    }

    move() {
        if (this.movementFlag) {
            this.rotateY(-(Date.now() % 0.005));
            this.rotateX(-(Date.now() % 0.005));
            return
        }
        // Multiplies the ratios by Math.PI to convert it to radians
        const roll = (this.render.mouseControl.drag.offset.x / this.render.canvas.width) * Math.PI;
        const pitch = (this.render.mouseControl.drag.offset.y / this.render.canvas.height) * Math.PI;
        this.rotateY(roll);
        this.rotateX(pitch);
    }

    /**
     * Divide the vertices by the homogeneous coordinate
     * This operation is known as homogeneous division or perspective division, and it's a common step in the process
     * of projecting 3D points onto a 2D screen in computer graphics. It essentially converts the homogeneous coordinates
     * back to regular 3D coordinates.
     * @param {number[][]} vertices
     * @returns {number[][]}
     */
    #homogeneousDivision(vertices) {
        return vertices.map(vertex => {
            const w = vertex[3];
            return vertex.map(value => value / w);
        });
    }

    /**
     * Check if the vertices are within the screen
     * @param {number[][]}vertices
     * @returns {boolean}
     */
    #isWithinScreen(vertices) {
        return true;
        // Check if all the vertices are within the screen [-1, 1]
        return vertices.every(vertex => vertex[0] > 0 &&
            vertex[0] < this.render.WIDTH
            && vertex[1] > 0 && vertex[1] < this.render.HEIGHT
        );
    }

    /**
     * Project the 3D object to the 2D screen
     *
     * @returns {void}
     */
    screenProjection() {
        let vertices = matMulti(this.vertices, this.render.camera.getCameraStateMatrix());
        // Project the vertices to the 2D screen
        vertices = matMulti(vertices, this.render.projection.get2DProjectionMatrix());
        vertices = this.#homogeneousDivision(vertices);
        vertices = vertices.map(value => value > 2 || value < -2 ? 0 : value);
        // Denormalize the vertices to the screen size
        vertices = matMulti(vertices, this.render.projection.getScreenDenormalizeMatrix());

        for (let i = 0; i < vertices.length; i++) {
            // Remove the z and homogeneous coordinate. We only need the x and y coordinates.
            vertices[i] = vertices[i].slice(0, 2);
        }
        this.#draw(vertices);
    }

    #draw(vertices) {
        const self = this;
        this.colorFaces.forEach(({color, face}) => {
            const polygon = face.map(index => vertices[index]);

            if (this.#isWithinScreen(polygon)) {
                this.render.ctx.strokeStyle = color;
                this.render.ctx.beginPath();
                let x = polygon[0][0];
                let y = polygon[0][1];
                this.render.ctx.moveTo(x, y);
                for (let i = 1; i < polygon.length; i++) {
                    this.render.ctx.lineTo(polygon[i][0], polygon[i][1]);
                }
                this.render.ctx.closePath();
                this.render.ctx.stroke();
            }
        });

        if (this.drawVertices) {
            vertices.forEach(vertex => {
                if (vertex !== this.render.HALF_WIDTH && vertex !== this.render.HALF_HEIGHT) {
                    this.render.ctx.beginPath();
                    this.render.ctx.arc(vertex[0], vertex[1], 4, 0, Math.PI * 2);
                    this.render.ctx.fillStyle = '#777';
                    this.render.ctx.lineWidth = 2;
                    this.render.ctx.fill();
                    this.render.ctx.stroke();
                }
            });
        }
    }

    /**
     * Translate the object to a new position
     * @param pos
     */
    translate(pos) {
        this.vertices = matMulti(this.vertices, translate(pos));
    }

    scale(scaleTo) {
        this.vertices = matMulti(this.vertices, scale(scaleTo));
    }

    rotateX(angle) {
        this.vertices = matMulti(this.vertices, rotateX(angle));
    }

    rotateY(angle) {
        this.vertices = matMulti(this.vertices, rotateY(angle));
    }

    rotateZ(angle) {
        this.vertices = matMulti(this.vertices, rotateZ(angle));
    }
}