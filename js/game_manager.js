// CONSTRUCTOR
function GameManager(size, InputManager, Actuator, StorageManager, Solver) {
    // Initialize properties
    this.size           = size; // Side length of the square grid
    this.inputManager   = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator       = new Actuator();
    this.solver         = new Solver();
    this.startTiles     = 2;

    // Register game events
    this.inputManager.on(this.move.bind(this),         "move");
    this.inputManager.on(this.restart.bind(this),      "restart");
    this.inputManager.on(this.keepPlaying.bind(this),  "keepPlaying");
    this.inputManager.on(this.stepSolver.bind(this),   "stepSolver");
    this.inputManager.on(this.toggleSolver.bind(this), "toggleSolver");
    this.inputManager.on(this.solverSpeed.bind(this),  "solverSpeed");

    // Setup the game and do the initial actuation
    this.setup();
}

// METHODS
GameManager.prototype.setup = function () {
    // If a previous game's state is in storage, then restore that game
    var previousState = this.storageManager.getGameState();
    if (previousState !== null) {
        this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
        this.score = previousState.score;
        this.over = previousState.over;
        this.won = previousState.won;
        this.keepPlaying = previousState.keepPlaying;
    }

    // Otherwise, begin a new game
    else {
        this.grid = new Grid(this.size);
        this.score = 0;
        this.over = false;
        this.won = false;
        this.keepPlaying = false;

        this.addStartTiles();
    }

    // Update the actuator
    this.actuate();
}
GameManager.prototype.actuate = function () {
    // Update best score
    if (this.score > this.storageManager.getBestScore())
        this.storageManager.setBestScore(this.score);

    // If the game is over (game over only, not win), then clear the game state from local storage
    // Otherwise, update the saved game state
    if (this.over)
        this.storageManager.clearGameState();
    else
        this.storageManager.setGameState(this.serialize());

    // Pass the game's grid and metadata to the HTML actuator to start the first frame
    var metadata = {
        score: this.score,
        over: this.over,
        won: this.won,
        bestScore: this.storageManager.getBestScore(),
        terminated: this.isGameTerminated()
    }
    this.actuator.actuate(this.grid, metadata);
}
GameManager.prototype.addStartTiles = function () {
    // Set up the initial tiles to start the game with
    for (var i = 0; i < this.startTiles; i++)
        this.grid.addRandomTile();
}
GameManager.prototype.prepareTiles = function () {
    // Save all tile positions and remove merger info
    this.grid.eachCell(function (x, y, tile) {
        if (tile !== null) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });
}
GameManager.prototype.moveTile = function (tile, cell) {
    // Move a tile and its representation
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
}
GameManager.prototype.isTileMoved = function (x, y, vector) {
    // If there's no tile in this position then return false
    cell = { x: x, y: y };
    tile = this.grid.cellContent(cell);
    if (tile === null)
        return false;

    // Only one merger per row traversal?
    var positions = this.grid.findFarthestPosition(cell, vector);
    var next = this.grid.cellContent(positions.next);
    if (next !== null && next.value === tile.value && !next.mergedFrom) {
        var merged = new Tile(positions.next, tile.value * 2);
        merged.mergedFrom = [tile, next];

        this.grid.insertTile(merged);
        this.grid.removeTile(tile);

        // Converge the two tiles' positions
        tile.updatePosition(positions.next);

        // Update the score
        this.score += merged.value;

        // The mighty 2048 tile
        if (merged.value === 2048) this.won = true;
    }
    else
        this.moveTile(tile, positions.farthest);

    if (!this.positionsEqual(cell, tile))
        return true; // The tile moved from its original cell!
}

// FUNCTIONS
GameManager.prototype.isGameTerminated = function () {
    // Return true whether the game was lost, won, or quit by the player
    return this.over || (this.won && !this.keepPlaying);
}
GameManager.prototype.serialize = function () {
    // Represent the current game as an object
    return {
        grid:        this.grid.serialize(),
        score:       this.score,
        over:        this.over,
        won:         this.won,
        keepPlaying: this.keepPlaying
    };
}
GameManager.prototype.getVector = function (direction) {
    // Get the vector representing the chosen direction
    // Vectors representing tile movement
    var map = {
        0: { x: 0,  y: -1 }, // Up
        1: { x: 1,  y: 0 },  // Right
        2: { x: 0,  y: 1 },  // Down
        3: { x: -1, y: 0 }   // Left
    };

    return map[direction];
}
GameManager.prototype.buildTraversals = function (vector) {
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
GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
}
GameManager.prototype.tileMatchesAvailable = function () {
    // Check for available matches between tiles (more expensive check)

    // For each cell on the grid...
    for (var x = 0; x < this.size - 1; x++) {
        for (var y = 0; y < this.size - 1; y++) {
            // If there's no tile here then skip
            var tile = this.grid.cellContent({ x: x, y: y });
            if (tile === null) continue;

            // If this tile can merge with one below it or to the right, then return true
            var aboveTile = this.grid.cellContent({ x: x, y: y - 1 });
            var rightTile = this.grid.cellContent({ x: x + 1, y: y });
            var canMergeUp = (aboveTile !== null && aboveTile.value === tile.value);
            var canMergeRight = (rightTile !== null && rightTile.value === tile.value);
            if (canMergeUp || canMergeRight)
                return true;
        }
    }

    return false;
}
GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
}

// GAME EVENT LISTENERS
GameManager.prototype.move = function (direction) {
    // Move tiles on the grid in the specified direction
    // 0: up, 1: right, 2: down, 3: left

    // Don't do anything if the game's over
    if (this.isGameTerminated())
        return;

    var cell, tile;
    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var anyTileMoved = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction to see if any tiles moved
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            var tileMoved = this.isTileMoved.call(this, traversals.x[i], traversals.y[j], vector);
            if (tileMoved)
                anyTileMoved = true;
        }
    }

    // If it did, then draw the next frame and return
    if (!anyTileMoved) return;
    this.grid.addRandomTile();
    if (!this.movesAvailable())
        this.over = true; // Game over!
    this.actuate();
    return;
}
GameManager.prototype.keepPlaying = function () {
    // Keep playing after winning (allows going over 2048)
    this.keepPlaying = true;
    this.actuator.continueGame();
}
GameManager.prototype.restart = function () {
    // Restart the game
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();
}
GameManager.prototype.stepSolver = function(){
    var direction = this.solver.getNextMove(this.grid);
    this.move(direction);
}
GameManager.prototype.toggleSolver = function(){
    this.actuator.toggleSolver();
}
GameManager.prototype.solverSpeed = function (direction) {
    // Increment/decrement the solver's moves/second
    if (direction > 0)
        this.solver.increaseRate();
    else
        this.solver.decreaseRate();
}