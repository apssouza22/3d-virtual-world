class CameraPosition{
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Camera3d {

    /**
     *
     * @param {SoftwareRender} render
     * @param {CameraPosition} position
     */
    constructor(render, position) {
        this.position = [position.x, position.y, position.z, 1.0];
        this.forward = [0, 0, 1, 1]; // The direction the camera is facing
        this.up = [0, 1, 0, 1]; // The direction of the top of the camera
        this.right = [1, 0, 0, 1]; // The direction of the right of the camera

        // FOV = Field of View - the angle of the camera
        this.horizontalFov = Math.PI / 3; // 60 degrees
        this.verticalFov = this.horizontalFov * (render.HEIGHT / render.WIDTH);
        this.nearPlane = 0.1;
        this.farPlane = 100;
        this.moving_speed = 0.5;
        this.rotation_speed = 0.02;

        this.anglePitch = 0;
        this.angleYaw = 0;
        this.angleRoll = 0;

        document.addEventListener('keydown', (event) => this.control(event));
    }

    control(event) {
        switch (event.code) {
            case 'KeyA':
                this.position = subtract(this.position, matMulti(this.moving_speed, this.right));
                break;
            case 'KeyD':
                this.position = add(this.position, matMulti(this.moving_speed, this.right));
                break;
            case 'KeyW':
                this.position = add(this.position, matMulti(this.moving_speed, this.forward));
                break;
            case 'KeyS':
                this.position = subtract(this.position, matMulti(this.moving_speed, this.forward));
                break;
            case 'KeyQ':
                this.position = add(this.position, matMulti(this.moving_speed, this.up));
                break;
            case 'KeyE':
                this.position = subtract(this.position, matMulti(this.moving_speed, this.up));
                break;
            case 'ArrowLeft':
                this.cameraYaw(-this.rotation_speed);
                break;
            case 'ArrowRight':
                this.cameraYaw(this.rotation_speed);
                break;
            case 'ArrowUp':
                this.cameraPitch(-this.rotation_speed);
                break;
            case 'ArrowDown':
                this.cameraPitch(this.rotation_speed);
                break;
        }
    }

    /**
     * Move the camera forward or backward
     * @param angle
     */
    cameraYaw(angle) {
        this.angleYaw += angle;
    }

    /**
     * Move the camera up or down
     * @param angle
     */
    cameraPitch(angle) {
        this.anglePitch += angle;
    }

    initializeDirection() {
        this.forward = [0, 0, 1, 1]; // The direction the camera is facing
        this.up = [0, 1, 0, 1]; // The direction of the top of the camera
        this.right = [1, 0, 0, 1]; // The direction of the right of the camera
    }

    cameraUpdateDirection() {
        let rotate = matMulti(rotateX(this.anglePitch), rotateY(this.angleYaw));
        this.initializeDirection();
        this.forward = matMulti(this.forward, rotate)[0];
        this.right = matMulti(this.right, rotate)[0];
        this.up = matMulti(this.up, rotate)[0];
    }

    /***
     * Get the camera state matrix
     * @returns {number[][]}
     */
    getCameraStateMatrix() {
        this.cameraUpdateDirection();
        return matMulti(this.translate_matrix(), this.rotate_matrix());
    }

    /**
     * A translation matrix is used to move an object from one place to another.
     * @returns {number[][]}
     */
    translate_matrix() {
        let [x, y, z, w] = this.position;
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [-x, -y, -z, 1]
        ];
    }

    /***
     * A rotation matrix is used to rotate an object around a specific axis.
     * @returns {number[][]}
     */
    rotate_matrix() {
        let [rx, ry, rz, w1] = this.right;
        let [fx, fy, fz, w2] = this.forward;
        let [ux, uy, uz, w3] = this.up;
        return [
            [rx, ux, fx, 0],
            [ry, uy, fy, 0],
            [rz, uz, fz, 0],
            [0, 0, 0, 1]
        ];
    }
}
