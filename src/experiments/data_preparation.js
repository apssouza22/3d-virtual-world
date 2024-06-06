class ObjDataHandler {

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

    /**
     * Add homogeneous coordinates to the vertices
     * @param {string[][]} vert
     * @returns {number[][]}
     */
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
