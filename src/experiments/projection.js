/**
 * Projection class to handle the projection matrix using view frustum algorithm
 */
class Projection {

    /**
     *
     * @param {Render3D} render
     */
    constructor(render) {
        this.render = render;
        // Denormalize vertices to the screen size matrix
        this.toScreenMatrix = [
            [render.HALF_WIDTH, 0, 0, 0],
            [0, -render.HALF_HEIGHT, 0, 0],
            [0, 0, 1, 0],
            [render.HALF_WIDTH, render.HALF_HEIGHT, 0, 1]
        ];
    }

    /**
     * Get the screen denormalize matrix
     * @returns {*|((*|number)[]|number[])[]}
     */
    getScreenDenormalizeMatrix() {
        return this.toScreenMatrix;
    }

    /**
     * Get the 2D projection matrix
     * @returns {number[][]}
     */
    get2DProjectionMatrix() {
        const NEAR = this.render.camera.nearPlane;
        const FAR = this.render.camera.farPlane;
        const RIGHT = Math.tan(this.render.camera.horizontalFov / 2);
        const LEFT = -RIGHT;
        const TOP = Math.tan(this.render.camera.verticalFov / 2);
        const BOTTOM = -TOP;

        const m00 = 2 / (RIGHT - LEFT);
        const m11 = 2 / (TOP - BOTTOM);
        const m22 = (FAR + NEAR) / (FAR - NEAR);
        const m32 = -2 * NEAR * FAR / (FAR - NEAR);

        return [
            [m00, 0, 0, 0],
            [0, m11, 0, 0],
            [0, 0, m22, 1],
            [0, 0, m32, 0]
        ];
    }
}