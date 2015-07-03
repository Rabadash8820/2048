// CONSTRUCTOR
function AutoSolver() {
    // Set members involved in changing the solver's rate
    this.RATE_FACTOR = 1.5;
    this.MIN_RATE = 0.1;
    this.MAX_RATE = 60;
    this.rate = 1;

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
    // If there is no tile here, then swipe in the default direction
    if (tile !== null) {
        var pos = document.getElementsByClassName("tile-position-" + tile.x + "-" + tile.y);
        pos[0].className += " highlighted";
    }
    if (tile === null)
        return this.getDefaultDirection(grid, growVector, normalVector);

    // Get the immediately neighboring cells/tiles
    var normalCell = { x: tile.x + normalVector.x, y: tile.y + normalVector.y };
    var growCell = { x: tile.x + growVector.x, y: tile.y + growVector.y };
    var normal = grid.tileAt(normalCell);
    var grow = grid.tileAt(growCell);

    // Try to merge in the normal or grow directions (in that order)
    // For the grow direction, only do so if the neighbors are distant
    var shouldSwipeNormal = this.shouldSwipe(grid, tile, normalVector);
    if (shouldSwipeNormal)
        return { x: -normalVector.x, y: -normalVector.y };
    var shouldSwipeGrow = this.shouldSwipe(grid, tile, growVector);
    if (shouldSwipeGrow && grow === null)
        return { x: -growVector.x, y: -growVector.y };

    // If no merges could be made then move recursively in the grow direction
    // Unless the grow tile is larger than this one...then move in the normal direction
    // If the grow direction went off the grid, then move to the normal cell with a reversed grow direction
    // That way, tiles will "snake" around the grid as they merge
    var normalCell = { x: tile.x + normalVector.x, y: tile.y + normalVector.y };
    var growCell   = { x: tile.x + growVector.x,   y: tile.y + growVector.y   };
    var normal = grid.tileAt(normalCell);
    var grow   = grid.tileAt(growCell);
    if (grid.withinBounds(growCell) && (grow === null || grow.value <= tile.value))
        return this.bestDirection(grid, grow, growVector, normalVector);
    if (grid.withinBounds(growCell) && grow.value > tile.value)
        return this.bestDirection(grid, normal, growVector, normalVector);
    if (grid.withinBounds(normalCell)) {
        var reverseGrowVector = { x: -growVector.x, y: -growVector.y };
        return this.bestDirection(grid, normal, reverseGrowVector, normalVector);
    }

    // If both directions went off the grid, then
    // there are no cells left to move to, so swipe in the default direction
    return this.getDefaultDirection(grid, growVector, normalVector);
}
AutoSolver.prototype.shouldSwipe = function (grid, tile, vector) {
    var c = 1;
    var neighbor = { x: tile.x + vector.x, y: tile.y + vector.y };
    while (grid.withinBounds(neighbor)) {
        var normal = grid.tileAt(neighbor);
        if (normal !== null)
            return (normal.value === tile.value);
        c++;
        var neighbor = { x: tile.x + c * vector.x, y: tile.y + c * vector.y };
    }
    return false;
}

// HELPER FUNCTIONS
AutoSolver.prototype.getTargetCorner = function (grid) {
    // TO DO: the triangular half of the grid with the largest sum points at the target corner

    var cell = {
        x: 0,
        y: grid.size - 1
    };
    return cell;
}
AutoSolver.prototype.getGrowVector = function (grid, cornerCell) {
    // TO DO: the triangular half of the grid that bisects the corner and has the largest sum contains the grow vector

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

    // Define a bit field to represent the set of allowed directions
    var allowed = this.getAllowedVectors(grid, reverseNormal, reverseGrow, grow, normal);

    // Return a direction from this intersection with the priority:
    // reverseNormal, then reverseGrow, then grow, then normal
    if (allowed & rn) return reverseNormal;
    if (allowed & rg) return reverseGrow;
    if (allowed & g)  return grow;
    if (allowed & n)  return normal;
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
