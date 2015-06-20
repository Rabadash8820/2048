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

// METHODS FOR CHECKING AVAILABLE CELLS
Grid.prototype.availableCells = function () {
    // Return an array of cells that have no tiles
    var cells = [];
    this.eachCell(function (x, y, tile) {
        if (tile === null) {
            cells.push({
                x: x,
                y: y
            });
        }
    });
    return cells;
}
Grid.prototype.cellsAvailable = function () {
    return this.availableCells().length > 0;
}
Grid.prototype.cellContent = function (cell) {
    if (this.withinBounds(cell))
        return this.cells[cell.x][cell.y];
    else
        return null;
}
Grid.prototype.cellAvailable = function (cell) {
    return this.cellContent(cell) === null;
}
Grid.prototype.randomAvailableCell = function () {
    // Find the first available random position
    var cells = this.availableCells();
    if (cells.length)
        return cells[Math.floor(Math.random() * cells.length)];
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
             this.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
}

// METHODS FOR UPDATING CELLS
Grid.prototype.eachCell = function (callback) {
    // Call the callback function on every cell
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++)
            callback(x, y, this.cells[x][y]);
    }
}
Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
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
Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size &&
           position.y >= 0 && position.y < this.size;
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