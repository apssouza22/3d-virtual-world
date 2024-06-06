class DataHandler {

    /**
     * Constructor
     * @param {HTMLCanvasElement}canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
    }

    /**
     * Sort faces by depth (Z axis)
     * @param {number[][]}faces
     * @param {number[][]} vert
     * @returns {number[][]}
     */
    sortFaces(faces, vert) {
        let self = this;
        return faces.sort(function (a, b) {
            let aZ;
            let bZ;
            let i = 0;
            let sum = 0.0;
            while (i < a.length - 1) {
                sum = sum + vert[a[i]][2];
                i = i + 1;
            }
            aZ = sum / i;
            i = 0;
            sum = 0;
            while (i < b.length - 1) {
                sum = sum + vert[b[i]][2];
                i = i + 1;
            }
            bZ = sum / i;
            if (aZ < bZ) return -1;
            if (aZ > bZ) return 1;
            return 0;
        }).reverse();
    }

    // scale(data) {
    //     let scale = this.#calculateScale(data.max);
    //     // loop over vertices and scale them
    //     for (let i = 0; i < data.vert.length; i++) {
    //         for (let j = 0; j < data.vert[i].length; j++) {
    //             data.vert[i][j] = data.vert[i][j] * scale;
    //         }
    //     }
    //     return data.vert;
    // }

    // #calculateScale(max) {
    //     let dim;
    //     if (this.canvas.width < this.canvas.height) {
    //         dim = this.canvas.width;
    //     } else {
    //         dim = this.canvas.height;
    //     }
    //     return Math.round((0.95 * dim) / (2 * max));
    // };

    addHomogeneous(vert) {
        let i = 0;
        let vertHom = new Array(vert.length);
        while (i < vert.length) {
            vertHom[i] = [parseFloat(vert[i][0]), parseFloat(vert[i][1]), parseFloat(vert[i][2]), 1];
            i = i + 1;
        }
        return vertHom;
    }
}

class Drawer {
    drawVertices = true;
    shouldLimitScreen = false;

    constructor(ctx, vertices, faces, materials) {
        this.ctx = ctx;
        this.vertices = vertices;
        this.faces = faces;
        this.materials = materials;
    }


    /**
     * Check if the vertices are within the screen
     * @param {number[][]}vertices
     * @returns {boolean}
     */
    #isWithinScreen(vertices) {
        if (!this.shouldLimitScreen) {
            return true;
        }
        // Check if all the vertices are within the screen [-1, 1]
        return vertices.every(vertex => vertex[0] > 0 &&
            vertex[0] < this.render.WIDTH
            && vertex[1] > 0 && vertex[1] < this.render.HEIGHT
        );
    }

    drawWork() {
        let pointColor = "rgba(10, 10, 10, 1)";
        let edgeColor = "rgba(100, 70, 70, 1)";
        let defaultColor = "rgba(180, 180, 255, .6)";
        let faceAlpha = .6;
        const drawPoints = true
        const drawFaces = true
        let vertSize = 10; //Make it even: at small scales will look better
        const vertices = this.vertices;
        const ctx = this.ctx;
        this.faces.forEach(({color, face}) => {
            const polygon = face.map(index => vertices[index]);

            if (this.#isWithinScreen(polygon)) {
                ctx.strokeStyle = edgeColor;
                ctx.fillStyle = pointColor;
                ctx.beginPath();
                let x = polygon[0][0];
                let y = polygon[0][1];
                ctx.moveTo(x, y);
                for (let i = 1; i < polygon.length; i++) {
                    const point = polygon[i];
                    ctx.lineTo(point[0], point[1]);
                    if (drawPoints) {
                        let x = point[0] - (vertSize / 2);
                        let y = point[1] - (vertSize / 2);
                        ctx.fillRect(x, y, vertSize, vertSize);
                    }
                }
                ctx.closePath();
                ctx.stroke();
                this.#useMtlMaterial(color, ctx, faceAlpha, defaultColor);
                if (drawFaces) {
                    ctx.fill();
                }
            }
        });
    }


    #useMtlMaterial(faceColor, ctx, faceAlpha, defaultFaceColor) {
        if (!this.materials || this.materials.length === 0) {
            ctx.fillStyle = "#999";
            return;
        }
        let rgbColor = this.#getRgbColor(faceColor);
        if (!rgbColor) {
            ctx.fillStyle = defaultFaceColor;
            return;
        }
        ctx.fillStyle = "rgba(" + rgbColor.r + ", " + rgbColor.g + ", " + rgbColor.b + ", " + faceAlpha + ")";
    }

    #getRgbColor(faceColor) {
        for (let i = 0; i < this.materials.length; i++) {
            if (this.materials[i][0] === faceColor) {
                return {
                    r: Math.round(255 * this.materials[i][1]),
                    g: Math.round(255 * this.materials[i][2]),
                    b: Math.round(255 * this.materials[i][3]),
                }
            }
        }
    }
}