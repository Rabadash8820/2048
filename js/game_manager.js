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
            var tile = this.grid.tileAt({ x: x, y: y });
            if (tile === null) continue;

            // If this tile can merge with one below it or to the right, then return true
            var aboveTile = this.grid.tileAt({ x: x, y: y - 1 });
            var rightTile = this.grid.tileAt({ x: x + 1, y: y });
            var canMergeUp    = (aboveTile !== null && aboveTile.value === tile.value);
            var canMergeRight = (rightTile !== null && rightTile.value === tile.value);
            if (canMergeUp || canMergeRight)
                return true;
        }
    }

    return false;
}

// GAME EVENT LISTENERS
GameManager.prototype.move = function (vector) {
    // Move tiles on the grid in the specified direction
    // 0: up, 1: right, 2: down, 3: left

    // Don't do anything if the game's over
    if (this.isGameTerminated())
        return;

    var cell, tile;
    var traversals = this.buildTraversals(vector);
    var anyTileMoved = false;

    // Save the current tile positions and remove merger information
    this.grid.prepareTiles();

    // Traverse the grid in the right direction to see if any tiles moved
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            var tileMoved = this.grid.isTileMoved(traversals.x[i], traversals.y[j], vector);
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