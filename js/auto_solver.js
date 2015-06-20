// CONSTRUCTOR
function AutoSolver() {
    this.RATE_FACTOR = 1.5;
    this.MIN_RATE = 0.1;
    this.MAX_RATE = 60;

    this.rate = 1;
}

// RATE GETTERS/SETTERS
AutoSolver.prototype.increaseRate = function () {
    var r = this.rate * this.RATE_FACTOR;
    this.rate = Math.min(r, this.MAX_RATE);
}
AutoSolver.prototype.decreaseRate = function () {
    var r = this.rate / this.RATE_FACTOR;
    this.rate = Math.max(r, this.MIN_RATE);
}

// FUNCTIONS FOR SOVLING 2048
AutoSolver.prototype.getNextMove = function (grid) {
    var corner = this.getTargetCorner(grid);
    return bestDirection(grid, corner, corner, this.getGrowVector(grid));
}
AutoSolver.prototype.bestDirection = function (grid, cell, corner, growVector) {
    // If there is no tile here, then swipe in the direction that creates the fewest large tiles
    var tile = grid[cell.x][cell.y];
    if (tile === null)
        return getMinDirection();

    // Otherwise...
    var val = tile.value;
    var normal = this.getNormalVector(grid, corner, growVector);

}
AutoSolver.prototype.getTargetCorner = function (grid) {

}
AutoSolver.prototype.getGrowVector = function (grid) {
    return {
        axis:      "x",
        direction: "+"
    };
}
AutoSolver.prototype.getNormalVector = function (grid, corner, growVector) {
    // Initialize variables
    var normal = { axis: "", direction: "" };
    var x=corner.x, y=corner.y;
    var axis = growVector.axis;

    // top-left corner
    if (x === 0 && y === 0) {
        if (axis === "x")
            return { axis: "y", direction: "+" };
        else if (axis === "y")
            return { axis: "x", direction: "+" };
    }

    // top-right corner
    else if (x === grid.size - 1 && y === 0) {
        if (axis === "x")
            return { axis: "y", direction: "+" };
        else if (axis === "y")
            return { axis: "x", direction: "-" };
    }

    // bottom-right corner
    else if (x === grid.size - 1 && y === grid.size - 1) {
        if (axis === "x")
            return { axis: "y", direction: "-" };
        else if (axis === "y")
            return { axis: "x", direction: "-" };
    }

    // bottom-left corner
    else if (x === 0 && y === grid.size - 1) {
        if (axis === "x")
            return { axis: "y", direction: "-" };
        else if (axis === "y")
            return { axis: "x", direction: "+" };
    }
}
