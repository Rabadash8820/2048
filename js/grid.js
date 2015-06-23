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
Grid.prototype.didTilesMove = function (vector) {
    var tile;
    var anyTileMoved = false;

    // Save all tile positions and remove merger info
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            var tile = this.cells[x][y];
            if (tile === null) continue;
            tile.mergedFrom = null;
            tile.previousPosition = { x: tile.x, y: tile.y };
        }
    }

    // Traverse the grid in the right direction to see if any tiles moved
    var traversals = this.buildTraversals(vector);
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            var tileMoved = this.isTileMoved(traversals.x[i], traversals.y[j], vector);
            if (tileMoved)
                anyTileMoved = true;
        }
    }

    // Return whether any tiles were moved
    return anyTileMoved;
}
Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
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
    this.insertTile(tile);
}
Grid.prototype.removeTile = function (tile) {
    this.cells[tile.x][tile.y] = null;
}
Grid.prototype.prepareTiles = function () {
    // Save all tile positions and remove merger info
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            var tile = this.cells[x][y];
            if (tile === null) continue;
            tile.mergedFrom = null;
            tile.previousPosition = { x: tile.x, y: tile.y };
        }
    }
}

// HELPER FUNCTIONS
Grid.prototype.isTileMoved = function (x, y, vector) {
    // If there's no tile in this position then return false
    var cell = { x: x, y: y };
    var tile = this.tileAt(cell);
    if (tile === null)
        return false;

    // Only one merger per row traversal?
    var positions = this.findFarthestPosition(cell, vector);
    var next = this.tileAt(positions.next);
    if (next !== null && next.value === tile.value && !next.mergedFrom) {
        var merged = new Tile(positions.next, tile.value * 2);
        merged.mergedFrom = [tile, next];

        this.insertTile(merged);
        this.removeTile(tile);

        // Converge the two tiles' positions
        tile.x = positions.next.x;
        tile.y = positions.next.y;

        // Update the score
        this.score += merged.value;

        // The mighty 2048 tile
        if (merged.value === 2048) this.won = true;
    }
    else
        this.moveTile(tile, positions.farthest);

    if (cell.x !== tile.x || cell.y !== tile.y)
        return true; // The tile moved from its original cell!
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