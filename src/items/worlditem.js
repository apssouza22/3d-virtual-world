class WorldItem {

    /**
     *
     * @param {Polygon} poly
     */
    constructor(poly) {
        this.polygon = poly;
    }

    draw(ctx, viewPoint) {
        throw new Error("Method 'draw()' must be implemented.");
    }

    /**
     * Get the polygons that represent the item.
     * @returns {Polygon}
     */
    poly() {
        return this.polygon;
    }
}