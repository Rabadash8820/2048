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
    var growVector = this.getGrowVector(grid, cornerCell);
    var normalVector = this.getNormalVector(grid, cornerCell, growVector);
    return this.bestDirection(grid, cornerCell, growVector, normalVector);
}
AutoSolver.prototype.bestDirection = function (grid, cell, growVector, normalVector, mergeVector) {
    // ***** FOR DEBUGGING *****
    if (grid.tileAt(cell) !== null) {
        var pos = document.getElementsByClassName("tile-position-" + cell.x + "-" + cell.y);
        pos[0].className += " highlighted";
    }

    // If there is no tile here...
    var tile = grid.tileAt(cell);
    if (tile === null) {
        // If this tile is the target corner, then immediately swipe in the reverse grow direction
        if (grid.isCornerCell(cell))
            return this.reverse(growVector);

        // Otherwise, swipe in the default direction, unless it would ruin the merge
        // In that case, swipe in the merge direction
        var defaultDir = this.getDefaultDirection(grid, growVector, normalVector);
        var reverseNormalVector = this.reverse(normalVector);
        if (mergeVector === undefined) return defaultDir;
        else return (defaultDir.x === reverseNormalVector.x && defaultDir.y === reverseNormalVector.y) ? defaultDir : mergeVector;
    }

    // Get the immediately neighboring cells/tiles
    var normalCell = { x: cell.x + normalVector.x, y: cell.y + normalVector.y };
    var growCell   = { x: cell.x + growVector.x,   y: cell.y + growVector.y   };
    var grow       = grid.tileAt(growCell);

    // Try to merge in the normal or grow directions (in that order)
    // For the grow direction, only do so if the neighbors are distant
    var shouldSwipeNormal = this.shouldSwipe(grid, tile, normalVector);
    if (shouldSwipeNormal)
        return this.reverse(normalVector);
    var shouldSwipeGrow = this.shouldSwipe(grid, tile, growVector);
    if (shouldSwipeGrow && grow === null)
        return this.reverse(growVector);
    else if (shouldSwipeGrow && grow !== null)
        mergeVector = this.reverse(growVector);

    // Move recursively in the grow direction
    // Unless the grow tile is larger than this one...then move in the normal direction
    // If the grow direction went off the grid, then move to the normal cell with a reversed grow direction
    // That way, tiles will "snake" around the grid as they merge
    if (grid.withinBounds(growCell) && (grow === null || grow.value <= tile.value))
        return this.bestDirection(grid, growCell, growVector, normalVector, mergeVector);
    if (grid.withinBounds(growCell) && grow.value > tile.value)
        return this.bestDirection(grid, normalCell, growVector, normalVector, mergeVector);
    if (grid.withinBounds(normalCell))
        return this.bestDirection(grid, normalCell, this.reverse(growVector), normalVector, mergeVector);

    // If both directions went off the grid, then there are no cells left to move to
    // so swipe in the default direction, unless it would ruin the merge
    // In that case, swipe in the merge direction
    var defaultDir = this.getDefaultDirection(grid, growVector, normalVector);
    var reverseNormalVector = this.reverse(normalVector);
    if (mergeVector === undefined) return defaultDir;
    else return (defaultDir.x === reverseNormalVector.x && defaultDir.y === reverseNormalVector.y) ? defaultDir : mergeVector;
}

// HELPER FUNCTIONS
AutoSolver.prototype.getTargetCorner = function (grid) {
    // FOR DEBUGGING !!!!!!!!!!
    return { x: 0, y: 3 };

    // Get the max tile values in the triangular half of the board associated with each corner
    var max = [[0, 0],
               [0, 0]];
    for (var x = 0; x < grid.size; x++) {
        for (var y = 0; y < grid.size; y++) {
            var tile = grid.tileAt({ x: x, y: y });
            if (tile === null) continue;
            if (y < x                 && tile.value > max[1][0]) max[1][0] = tile.value;
            if (y > x                 && tile.value > max[0][1]) max[0][1] = tile.value;
            if (y < grid.size - x - 1 && tile.value > max[0][0]) max[0][0] = tile.value;
            if (y > grid.size - x - 1 && tile.value > max[1][1]) max[1][1] = tile.value;
        }
    }

    // Return the corner with the largest sum
    var gridMax = Math.max(max[0][0], max[0][1], max[1][0], max[1][1]);
    if (max[0][0] === gridMax) return { x: 0, y: 0 };
    if (max[0][1] === gridMax) return { x: 0, y: grid.size - 1 };
    if (max[1][0] === gridMax) return { x: grid.size - 1, y: 0 };
    if (max[1][1] === gridMax) return { x: grid.size - 1, y: grid.size - 1 };
}
AutoSolver.prototype.getGrowVector = function (grid, cornerCell) {
    // TO DO: the triangular half of the grid that bisects the corner and has the largest sum contains the grow vector
    if (cornerCell.x === cornerCell.y) {

    }
    else {

    }

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
AutoSolver.prototype.shouldSwipe = function (grid, tile, vector) {
    var c = 1;
    var neighbor = { x: tile.x + vector.x, y: tile.y + vector.y };
    while (grid.withinBounds(neighbor)) {
        var t = grid.tileAt(neighbor);
        if (t !== null)
            return (t.value === tile.value);
        c++;
        var neighbor = { x: tile.x + c * vector.x, y: tile.y + c * vector.y };
    }
    return false;
}
AutoSolver.prototype.getDefaultDirection = function (grid, grow, normal) {
    // Determine the other two other relative swipe directions
    var reverseNormal = this.reverse(normal);
    var reverseGrow   = this.reverse(grow);

    // Determine the direction bit-flags associated with each relative swipe
    var rn, rg, g, n;
    if      (reverseNormal.x === 0  && reverseNormal.y === -1) rn = this.UP;
    else if (reverseNormal.x === -1 && reverseNormal.y === 0)  rn = this.LEFT;
    else if (reverseNormal.x === 0  && reverseNormal.y === 1)  rn = this.DOWN;
    else                                                       rn = this.RIGHT;

    if      (reverseGrow.x === 0  && reverseGrow.y === -1) rg = this.UP;
    else if (reverseGrow.x === -1 && reverseGrow.y === 0)  rg = this.LEFT;
    else if (reverseGrow.x === 0  && reverseGrow.y === 1)  rg = this.DOWN;
    else                                                   rg = this.RIGHT;
    
    if      (grow.x === 0  && grow.y === -1) g = this.UP;
    else if (grow.x === -1 && grow.y === 0)  g = this.LEFT;
    else if (grow.x === 0  && grow.y === 1)  g = this.DOWN;
    else                                     g = this.RIGHT;
    
    if      (normal.x === 0  && normal.y === -1) n = this.UP;
    else if (normal.x === -1 && normal.y === 0)  n = this.LEFT;
    else if (normal.x === 0  && normal.y === 1)  n = this.DOWN;
    else                                         n = this.RIGHT;

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
AutoSolver.prototype.reverse = function(vector){
    return {
        x: -vector.x,
        y: -vector.y
    };
}
