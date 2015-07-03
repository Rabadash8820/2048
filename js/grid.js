// CONSTRUCTOR
function Grid(size, cells) {
    this.size = size;

    // Initialize the grid's 2D cell array
    var tempCells = (cells !== undefined) ? this.copyOfCells(cells) : this.emptyCells();
    this.cells = tempCells;
}

// METHODS FOR CREATING GRID
Grid.prototype.emptyCells = function () {
    // Return a 2D grid of cells, where each cell's tile is null
    var cells = [];
    for (var row = 0; row < this.size; row++) {
        cells[row] = [];
        for (var col = 0; col < this.size; col++)
            cells[row][col] = null;
    }
    return cells;
}
Grid.prototype.copyOfCells = function (originalCells) {
    // Return a 2D grid of cells, where each cell's tile is copied from the provided game state
    var cells = [];
    for (var row = 0; row < this.size; row++) {
        cells[row] = [];
        for (var col = 0; col < this.size; col++) {
            var tOld = originalCells[row][col];
            var tNew = (tOld !== null) ? new Tile(tOld.position, tOld.value) : null;
            cells[row][col] = tNew;
        }
    }
    return cells;
}

// METHODS FOR CHECKING CELL AVAILABILITY
Grid.prototype.availableCells = function () {
    // Return an array of cells that have no tiles
    var cells = [];
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            if (this.cells[x][y] === null)
                cells.push({ x: x, y: y });
        }
    }
    return cells;
}
Grid.prototype.cellsAvailable = function () {
    return this.availableCells().length > 0;
}
Grid.prototype.tileAt = function (cell) {
    if (this.withinBounds(cell))
        return this.cells[cell.x][cell.y];
    else
        return null;
}
Grid.prototype.randomAvailableCell = function () {
    // Find the first available random position
    var cells = this.availableCells();
    if (cells.length)
        return cells[Math.floor(Math.random() * cells.length)];
}

// ACTIONS ON CELLS
Grid.prototype.scoreDeltaFromSwipe = function (vector) {
    // Save all tile positions and remove merger info
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            var tile = this.cells[x][y];
            if (tile === null) continue;
            tile.mergedFrom = null;
            tile.previousPosition = { x: tile.x, y: tile.y };
        }
    }

    // Traverse the grid in the right direction to see if any tiles move
    // Store the score increments produced by any merges
    var anyTileMoved = false;
    var increment = 0;
    var traversals = this.buildTraversals(vector);
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            var tileInc = this.tileIncrement(traversals.x[i], traversals.y[j], vector);
            if (tileInc !== -1) {
                anyTileMoved = true;
                increment += tileInc;
            }
        }
    }

    // Return the score increment, or a sentinel value if no tiles moved
    return anyTileMoved ? increment : -1;
}
Grid.prototype.moveTile = function (tile, cell) {
    // Move a tile and its representation
    this.cells[tile.x][tile.y] = null;
    this.cells[cell.x][cell.y] = tile;
    tile.x = cell.x;
    tile.y = cell.y;
}
Grid.prototype.addRandomTile = function () {
    // Adds a tile in a random position
    if (!this.cellsAvailable()) return;
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.randomAvailableCell(), value);
    this.cells[tile.x][tile.y] = tile;
}

// HELPER FUNCTIONS
Grid.prototype.tileIncrement = function (x, y, vector) {
    // If there's no tile in this position then return a sentinel value
    var delta = 0;
    var cell = { x: x, y: y };
    var tile = this.tileAt(cell);
    if (tile === null)
        return -1;

    // Only one merger per row traversal?
    var positions = this.findFarthestPosition(cell, vector);
    var next = this.tileAt(positions.next);
    if (next !== null && next.value === tile.value && !next.mergedFrom) {
        // Merge these two tiles
        var merged = new Tile(positions.next, tile.value * 2);
        merged.mergedFrom = [tile, next];
        this.cells[merged.x][merged.y] = merged;
        this.cells[tile.x][tile.y] = null;
        tile.x = positions.next.x;
        tile.y = positions.next.y;

        // Increment the amount by which the score increases
        delta = merged.value;
    }
    else
        this.moveTile(tile, positions.farthest);

    // Return the score increment, or a sentinel value if the tile didn't move
    if (cell.x !== tile.x || cell.y !== tile.y)
        return delta;
    return -1;
}
Grid.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell = {
            x: previous.x + vector.x,
            y: previous.y + vector.y
        };
    } while (this.withinBounds(cell) &&
             this.tileAt(cell) === null);

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
}
Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size &&
           position.y >= 0 && position.y < this.size;
}
Grid.prototype.buildTraversals = function (vector) {
    // Build a list of positions to traverse in the right order
    var traversals = {
        x: [],
        y: []
    };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1)
        traversals.x = traversals.x.reverse();
    if (vector.y === 1)
        traversals.y = traversals.y.reverse();

    return traversals;
}
Grid.prototype.serialize = function () {
    var cellState = [];

    for (var x = 0; x < this.size; x++) {
        var row = cellState[x] = [];
        for (var y = 0; y < this.size; y++)
            row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }

    return {
        size: this.size,
        cells: cellState
    };
}
Grid.prototype.tileMatchesAvailable = function () {
    // Check for available matches between tiles (more expensive check)

    // Check for available matches in vertical direction
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size - 1; y++) {
            var tile = this.tileAt({ x: x, y: y });
            if (tile === null) continue;
            var belowTile = this.tileAt({ x: x, y: y + 1 });
            if (belowTile.value === tile.value)
                return true;
        }
    }

    // Check for available matches in horizontal direction
    for (var y = 0; y < this.size; y++) {
        for (var x = 0; x < this.size - 1; x++) {
            var tile = this.tileAt({ x: x, y: y });
            if (tile === null) continue;
            var rightTile = this.tileAt({ x: x + 1, y: y });
            if (rightTile.value === tile.value)
                return true;
        }
    }

    return false;
}
