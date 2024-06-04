// The extra dimension (the fourth row and column in the 4x4 matrix) is used for homogeneous coordinates.
// This is a mathematical trick that allows us to perform translations (moving objects in 3D space) using matrix multiplication,
// which would not be possible with a 3x3 matrix.
// https://en.wikipedia.org/wiki/Rotation_matrix#In_three_dimensions

/**
 * Multiply two matrices
 * @param matrixA
 * @param matrixB
 * @returns {number[][]}
 */
function matMulti(matrixA, matrixB) {
    // If matrixA is a one-dimensional array, convert it to a 2D array with one row
    if (!Array.isArray(matrixA[0])) {
        matrixA = [matrixA];
    }

    if (matrixA[0].length !== matrixB.length && matrixA.length !== matrixB[0].length) {
        throw new Error("Cannot multiply these matrices: column count of first matrix must match row count of second matrix.");
    }

    // Initialize the result matrix
    const result = new Array(matrixA.length)
        .fill()
        .map(() => new Array(matrixB[0].length).fill(0));

    // Perform the multiplication
    for (let i = 0; i < matrixA.length; i++) {
        for (let j = 0; j < matrixB[0].length; j++) {
            for (let k = 0; k < matrixB.length; k++) {
                result[i][j] += matrixA[i][k] * matrixB[k][j];
            }
        }
    }
    return result;
}

function add(matrixA, matrixB) {
    // If matrixA is a one-dimensional array, convert it to a 2D array with one row
    if (!Array.isArray(matrixA[0])) {
        matrixA = [matrixA];
    }
    if (matrixA[0].length !== matrixB.length && matrixA.length !== matrixB[0].length) {
        throw new Error("Cannot multiply these matrices: column count of first matrix must match row count of second matrix.");
    }

    // Initialize the result matrix with the same dimensions
    const result = new Array(matrixA.length);

    // Perform the addition
    for (let i = 0; i < matrixA.length; i++) {
        result[i] = new Array(matrixA[i].length);
        for (let j = 0; j < matrixA[i].length; j++) {
            result[i][j] = matrixA[i][j] + matrixB[i][j];
        }
    }

    return result;
}

function subtract(matrixA, matrixB) {
    // If matrixA is a one-dimensional array, convert it to a 2D array with one row
    if (!Array.isArray(matrixA[0])) {
        matrixA = [matrixA];
    }
    // Check if both matrices have the same dimensions
    if (matrixA.length !== matrixB.length || matrixA[0].length !== matrixB[0].length) {
        throw new Error("Cannot subtract these matrices: they must be of the same dimensions.");
    }

    // Initialize the result matrix with the same dimensions
    const result = new Array(matrixA.length);

    // Perform the subtraction
    for (let i = 0; i < matrixA.length; i++) {
        result[i] = new Array(matrixA[i].length);
        for (let j = 0; j < matrixA[i].length; j++) {
            result[i][j] = matrixA[i][j] - matrixB[i][j];
        }
    }

    return result;
}


/**
 * A translation matrix is used to move an object from one place to another.
 * @param pos
 * @returns {((number|*)[]|number[])[]}
 */
function translate(pos) {
    let [tx, ty, tz] = pos;
    return [
        [1, 0, 0, tx],
        [0, 1, 0, ty],
        [0, 0, 1, tz],
        [0, 0, 0, 1]
    ];
}

function rotateX(a) {
    return [
        [1, 0, 0, 0],
        [0, Math.cos(a), Math.sin(a), 0],
        [0, -Math.sin(a), Math.cos(a), 0],
        [0, 0, 0, 1]
    ];
}

function rotateY(a) {
    return [
        [Math.cos(a), 0, -Math.sin(a), 0],
        [0, 1, 0, 0],
        [Math.sin(a), 0, Math.cos(a), 0],
        [0, 0, 0, 1]
    ];
}

function rotateZ(a) {
    return [
        [Math.cos(a), Math.sin(a), 0, 0],
        [-Math.sin(a), Math.cos(a), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}

function scale(n) {
    return [
        [n, 0, 0, 0],
        [0, n, 0, 0],
        [0, 0, n, 0],
        [0, 0, 0, 1]
    ];
}
