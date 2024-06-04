class Projection {

    /**
     *
     * @param {SoftwareRender} render
     */
    constructor(render) {
        const NEAR = render.camera.nearPlane;
        const FAR = render.camera.farPlane;
        const RIGHT = Math.tan(render.camera.horizontalFov / 2);
        const LEFT = -RIGHT;
        const TOP = Math.tan(render.camera.verticalFov / 2);
        const BOTTOM = -TOP;

        const m00 = 2 / (RIGHT - LEFT);
        const m11 = 2 / (TOP - BOTTOM);
        const m22 = (FAR + NEAR) / (FAR - NEAR);
        const m32 = -2 * NEAR * FAR / (FAR - NEAR);

        this.projectionMatrix = [
            [m00, 0, 0, 0],
            [0, m11, 0, 0],
            [0, 0, m22, 1],
            [0, 0, m32, 0]
        ];

        // Denormalize vertices to the screen size matrix
        this.toScreenMatrix = [
            [render.HALF_WIDTH, 0, 0, 0],
            [0, -render.HALF_HEIGHT, 0, 0],
            [0, 0, 1, 0],
            [render.HALF_WIDTH, render.HALF_HEIGHT, 0, 1]
        ];
    }
}