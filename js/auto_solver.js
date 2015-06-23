// CONSTRUCTOR
function AutoSolver() {
    this.RATE_FACTOR = 1.5;
    this.MIN_RATE = 0.1;
    this.MAX_RATE = 60;
    this.OFF_GRID = -1;

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
    // Get the best-direction vector in axis-direction form
    var corner = this.getTargetCorner(grid);
    var growVector = this.getGrowVector(grid);
    var vector = this.bestDirection(grid, corner, corner, growVector);

    // Return the unique movement id for this axis/direction
    return this.getMovementId(vector);
}
AutoSolver.prototype.bestDirection = function (grid, tile, corner, growVector) {
    // If there is no tile here, then swipe in the direction that creates the fewest large tiles
    if (tile === null)
        return this.getMinDirection();

    // Otherwise, try to merge with the neighboring tile in the normal direction
    var normalVector = this.getNormalVector(grid, corner, growVector);
    var normal = this.getNeighborCell(grid, tile, normalVector);
    if (normal !== this.OFF_GRID && normal !== null && normal.value === tile.value)
        return { x: -normal.x, y: -normal.y };


    // If that merge would be invalid, then try to merge with the neighboring tile in the grow direction
    var next = this.getNeighborCell(grid, tile, growVector);
    if (next !== this.OFF_GRID && next !== null && next.value === tile.value)
        return { x: -growVector.x, y: -growVector.y };

    // If neither merge would be valid, then recursively move to the next cell
    // The next cell is in either the grow direction or the direction normal to it...
    // whichever yields the cell with the lower tile-value (grow direction if tied).
    // Grow direction is adjusted so cells will "snake" around the grid as they merge
    if (next !== this.OFF_GRID) {
        if (normal === this.OFF_GRID || normal === null || next.value <= normal.value)
            return this.bestDirection(grid, next, corner, growVector);
        else
            return this.bestDirection(grid, normal, corner, growVector);
    }
    else if (normal !== this.OFF_GRID) {
        var reverseGrowVector = { x: -growVector.x, y: -growVector.y };
        var nextCorner = this.oppositeCorner(grid, corner, growVector);
        return this.bestDirection(grid, normal, nextCorner, reverseGrowVector);
    }

    // If there are no further cells that can be checked, 
    // then swipe in the direction that creates the fewest large tiles
    else
        return this.getMinDirection();
}
AutoSolver.prototype.getTargetCorner = function (grid) {
    var cell = {
        x: 0,
        y: grid.size - 1
    };
    return grid.cells[cell.x][cell.y];
}
AutoSolver.prototype.getGrowVector = function (grid) {
    return {
        x: 0,
        y: -1
    };
}
AutoSolver.prototype.getNormalVector = function (grid, corner, growVector) {
    // Initialize variables
    var x=corner.x, y=corner.y;
    var dx = growVector.x, dy=growVector.y;

    // top-left corner
    if (x === 0 && y === 0) {
        if (dy === 0)
            return { x: 0, y: 1 };
        else if (dx === 0)
            return { x: 1, y: 0 };
    }

    // top-right corner
    else if (x === grid.size - 1 && y === 0) {
        if (dy === 0)
            return { x: 0, y: 1 };
        else if (dx === 0)
            return { x: -1, y: 0 };
    }

    // bottom-right corner
    else if (x === grid.size - 1 && y === grid.size - 1) {
        if (dy === 0)
            return { x: 0, y: -1 };
        else if (dx === 0)
            return { x: -1, y: 0 };
    }

    // bottom-left corner
    else if (x === 0 && y === grid.size - 1) {
        if (dy === 0)
            return { x: 0, y: -1 };
        else if (dx === 0)
            return { x: 1, y: 0 };
    }
}
AutoSolver.prototype.getNeighborCell = function (grid, cell, vector) {
    // Get the neighboring cell
    cell = {
        x: cell.x + vector.x,
        y: cell.y + vector.y
    };

    // If that cell is on the grid then return its tile, otherwise return null
    return (grid.withinBounds(cell)) ? grid.cells[cell.x][cell.y] : this.OFF_GRID;
}
AutoSolver.prototype.oppositeCorner = function (grid, cell, growVector) {
    cell = {
        x: cell.x + grid.size * growVector.x - 1,
        y: cell.y + grid.size * growVector.y - 1
    };
    return cell;
}
AutoSolver.prototype.getMovementId = function (vector) {
    // 0: up, 1: right, 2: down, 3: left
    if (vector === { x: 1, y: 0 })
        return 1;
    else if (vector === { x: -1, y: 0 })
        return 3;
    else if (vector === { x: 0, y: 1 })
        return 2;
    else if (vector === { x: 0, y: -1 })
        return 0;
}