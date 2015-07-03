// CONSTRUCTOR
function AutoSolver() {
    // Set members involved in changing the solver's rate
    this.RATE_FACTOR = 1.5;
    this.MIN_RATE = 0.1;
    this.MAX_RATE = 60;
    this.rate = 1;

    this.OFF_GRID = -1;

    // Set bit values for the four relative swipe directions
    this.UP    = 1 << 0;
    this.LEFT  = 1 << 1;
    this.DOWN  = 1 << 2;
    this.RIGHT = 1 << 3;
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
    var cornerCell = this.getTargetCorner(grid);
    var growVector = this.getGrowVector(grid);
    var normalVector = this.getNormalVector(grid, cornerCell, growVector);
    var corner = grid.cells[cornerCell.x][cornerCell.y];
    return this.bestDirection(grid, corner, growVector, normalVector);
}
AutoSolver.prototype.bestDirection = function (grid, tile, growVector, normalVector) {
    // If there is no tile here, then swipe in the direction that creates the fewest merges
    if (tile === null)
        return this.getDefaultDirection(grid, growVector, normalVector);

    // Otherwise, try to merge with a neighboring tile (normal then grow directions)
    var normal = this.getNeighborCell(grid, tile, normalVector);
    if (normal !== this.OFF_GRID && normal !== null && normal.value === tile.value)
        return { x: -normalVector.x, y: -normalVector.y };
    var next = this.getNeighborCell(grid, tile, growVector);
    if (next !== this.OFF_GRID && next !== null && next.value === tile.value)
        return { x: -growVector.x, y: -growVector.y };

    // If no merges could be made...
    // Determine which of this tile's neighbors (if any) has the minimum value (or null)
    var minValue = null;
    if (normal !== null && next !== null)
        minValue = Math.min(normal.value, next.value);
    var normalMin = (normal !== this.OFF_GRID && (
                        (normal === null && minValue === null) ||
                        (normal !== null && normal.value === minValue)
                    ));
    var nextMin   = (next !== this.OFF_GRID && (
                        (next === null && minValue === null) ||
                        (next !== null && next.value === minValue)
                    ));    

    // Move recursively to the neighboring cell that has the min value (priority given to normal)
    // Grow vector and corner are adjusted so that cells will "snake" around the grid as they merge
    if (normalMin) {
        if (next === this.OFF_GRID) {
            var reverseGrowVector = { x: -growVector.x, y: -growVector.y };
            return this.bestDirection(grid, normal, reverseGrowVector, normalVector);
        }
        else
            return this.bestDirection(grid, normal, growVector, normalVector);
    }
    if (nextMin)
        return this.bestDirection(grid, next, growVector, normalVector);

    // If there are no cells left to move to, then swipe in the direction that
    // creates the fewest merges of all the allowed directions
    return this.getDefaultDirection(grid, growVector, normalVector);
}

// HELPER FUNCTIONS
AutoSolver.prototype.getTargetCorner = function (grid) {
    var cell = {
        x: 0,
        y: grid.size - 1
    };
    return cell;
}
AutoSolver.prototype.getGrowVector = function (grid) {
    return {
        x: 0,
        y: -1
    };
}
AutoSolver.prototype.getNormalVector = function (grid, cornerCell, growVector) {
    // Initialize variables
    var x = cornerCell.x, y = cornerCell.y;
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
AutoSolver.prototype.getDefaultDirection = function (grid, grow, normal) {
    // Determine the other two other relative swipe directions
    var reverseNormal = { x: -normal.x, y: -normal.y };
    var reverseGrow   = { x: -grow.x,   y: -grow.y   };

    // Determine the direction bit-flags associated with each relative swipe
    var rn, rg, g, n;
    if (reverseNormal.x === 0  && reverseNormal.y === -1) rn = this.UP;
    else if (reverseNormal.x === -1 && reverseNormal.y === 0) rn = this.LEFT;
    else if (reverseNormal.x === 0 && reverseNormal.y === 1) rn = this.DOWN;
    else rn = this.RIGHT;

    if (reverseGrow.x === 0 && reverseGrow.y === -1) rg = this.UP;
    else if (reverseGrow.x === -1 && reverseGrow.y === 0) rg = this.LEFT;
    else if (reverseGrow.x === 0 && reverseGrow.y === 1) rg = this.DOWN;
    else rg = this.RIGHT;
    
    if (grow.x === 0 && grow.y === -1) g = this.UP;
    else if (grow.x === -1 && grow.y === 0) g = this.LEFT;
    else if (grow.x === 0 && grow.y === 1) g = this.DOWN;
    else g = this.RIGHT;
    
    if (normal.x === 0 && normal.y === -1) n = this.UP;
    else if (normal.x === -1 && normal.y === 0) n = this.LEFT;
    else if (normal.x === 0 && normal.y === 1) n = this.DOWN;
    else n = this.RIGHT;

    // Use bit fields to determine the intersection of the set of allowed directions and
    // the set of directions that increment the score by the smallest amount
    // ****** WILL THIS SET-INTERSECTION ALWAYS BE NON-NULL?? *******
    var minimum = this.getMinimumVectors(grid);
    var allowed = this.getAllowedVectors(grid, reverseNormal, reverseGrow, grow, normal);
    var allowedMin = minimum & allowed;

    // Return a direction from this intersection with the priority:
    // reverseNormal, then reverseGrow, then grow, then normal
    if (allowedMin & rn) return reverseNormal;
    if (allowedMin & rg) return reverseGrow;
    if (allowedMin & g)  return grow;
    if (allowedMin & n)  return normal;
}
AutoSolver.prototype.getMinimumVectors = function (grid) {
    // Calculate how much the score would increment by swiping in the vertical direction
    var vertDelta = 0;
    for (var x = 0; x < grid.size; x++) {
        for (var y = 0; y < grid.size - 1; y++) {
            var tile = grid.tileAt({ x: x, y: y });
            var belowTile = grid.tileAt({ x: x, y: y + 1 });
            if (tile === null || belowTile === null) continue;
            if (belowTile.value === tile.value) {
                vertDelta += 2 * tile.value;
                y += 1; // so adjacent matches arent counted twice
            }
        }
    }

    // Calculate how much the score would increment by swiping in the horizontal direction
    var horzDelta = 0;
    for (var y = 0; y < grid.size; y++) {
        for (var x = 0; x < grid.size - 1; x++) {
            var tile = grid.tileAt({ x: x, y: y });
            var rightTile = grid.tileAt({ x: x + 1, y: y });
            if (tile === null || rightTile === null) continue;
            if (rightTile.value === tile.value) {
                horzDelta += 2 * tile.value;
                x += 1; // so adjacent matches arent counted twice
            }
        }
    }

    // Return the set of directions that least increment the score, represented by a bit field
    var allowed = 0;
    var minDelta = Math.min(vertDelta, horzDelta);
    if (vertDelta === minDelta)
        allowed |= (this.UP | this.DOWN);
    if (horzDelta === minDelta)
        allowed |= (this.LEFT | this.RIGHT);
    return allowed;
}
AutoSolver.prototype.getAllowedVectors = function (grid) {
    var allowed = 0;

    // See if any tiles can move/merge in the vertical direction
    for (var x = 0; x < grid.size; x++) {
        for (var y = 0; y < grid.size - 1; y++) {
            var tile     = grid.tileAt({ x: x, y: y     });
            var neighbor = grid.tileAt({ x: x, y: y + 1 });
            if (tile !== null && (neighbor === null|| (neighbor !== null && neighbor.value === tile.value)))
                allowed |= this.DOWN;
            if (neighbor !== null && (tile === null || (tile !== null && tile.value === neighbor.value)))
                allowed |= this.UP;
        }
    }

    // See if any tiles can move/merge in the horizontal direction
    for (var y = 0; y < grid.size; y++) {
        for (var x = 0; x < grid.size - 1; x++) {
            var tile     = grid.tileAt({ x: x,     y: y });
            var neighbor = grid.tileAt({ x: x + 1, y: y });
            if (tile !== null && (neighbor === null || (neighbor !== null && neighbor.value === tile.value)))
                allowed |= this.RIGHT;
            if (neighbor !== null && (tile === null || (tile !== null && tile.value === neighbor.value)))
                allowed |= this.LEFT;
        }
    }

    // Return the set of allowed directions, represented by a bit field
    return allowed;
}