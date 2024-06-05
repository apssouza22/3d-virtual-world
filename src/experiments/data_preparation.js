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

    scale(data) {
        let scale = this.#calculateScale(data.max);
        // loop over vertices and scale them
        for (let i = 0; i < data.vert.length; i++) {
            for (let j = 0; j < data.vert[i].length; j++) {
                data.vert[i][j] = data.vert[i][j] * scale;
            }
        }
        return data.vert;
    }

    #calculateScale(max) {
        let dim;
        if (this.canvas.width < this.canvas.height) {
            dim = this.canvas.width;
        } else {
            dim = this.canvas.height;
        }
        return Math.round((0.95 * dim) / (2 * max));
    };

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
    constructor(canvas, vertices, faces, materials) {
        this.canvas = canvas;
        this.vertices = vertices;
        this.faces = faces;
        this.materials = materials;
    }

    draw( useMtl, ctx) {
        let vertColor = "rgba(10, 10, 10, 1)";
        let edgeColor = "rgba(100, 70, 70, 1)";
        let faceColor = "rgba(180, 180, 255, .6)";
        let faceAlpha = .6;
        const dVerts = true
        const dFaces = true
        let vertSize = 4; //Make it even: at small scales will look better
        this.faces.forEach((face) => {
            ctx.strokeStyle = edgeColor;
            ctx.fillStyle = vertColor;
            ctx.beginPath();
            ctx.moveTo(this.vertices[face[0]][0], this.vertices[face[0]][1]);
            let lastFaceElement = face[face.length - 1];
            let onlyFaces = face.slice(0, face.length - 1);
            const vertex = onlyFaces.map(index => this.vertices[index])

            vertex.forEach(point => {
                ctx.lineTo(point[0], point[1]);
                ctx.stroke();
                if (dVerts) {
                    let x = point[0] - (vertSize / 2);
                    let y = point[1] - (vertSize / 2);
                    ctx.fillRect(x, y, vertSize, vertSize);
                }
            })

            ctx.closePath();
            if (useMtl) {
                this.useMtlMaterial(lastFaceElement, ctx, faceAlpha, faceColor);
            } else {
                ctx.fillStyle = faceColor;
            }
            if (dFaces) {
                ctx.fill();
            }
        });
    }

    useMtlMaterial(lastFaceElement, ctx, faceAlpha, faceColor) {
        if(!this.materials){
            return;
        }
        let j = 0;
        //Get material with the same name as the one in the last element of the face
        while (this.materials[j][0] !== lastFaceElement && j < this.materials.length) {
            j = j + 1;
        }
        if (this.materials[j][0] === lastFaceElement) {
            ctx.fillStyle = "rgba(" + Math.round(255 * this.materials[j][1]) + ", " + Math.round(255 * this.materials[j][2]) + ", " + Math.round(255 * this.materials[j][3]) + ", " + faceAlpha + ")";
        } else {
            ctx.fillStyle = faceColor;
        }
        return j;
    }
}