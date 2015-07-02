// CONSTRUCTOR
function GameManager(size, InputManager, Actuator, StorageManager, Solver) {
    // Initialize object members
    this.inputManager   = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator       = new Actuator();
    this.solver         = new Solver();

    // Define game states
    this.EARLY_GAME = 0;
    this.JUST_WON   = 1;
    this.JUST_LOST  = 2;
    this.LATE_GAME  = 3;

    // Register game events
    this.inputManager.on(this.move.bind(this),         "move");
    this.inputManager.on(this.restart.bind(this),      "restart");
    this.inputManager.on(this.keepPlaying.bind(this),  "keepPlaying");
    this.inputManager.on(this.stepSolver.bind(this),   "stepSolver");
    this.inputManager.on(this.toggleSolver.bind(this), "toggleSolver");
    this.inputManager.on(this.solverSpeed.bind(this),  "solverSpeed");

    // Setup the game and do the initial actuation
    this.setup(size);
}

// METHODS
GameManager.prototype.setup = function (size) {
    // If a previous game's state is in storage, then restore that game
    var previousState = this.storageManager.getGameState();
    if (previousState !== null) {
        this.grid        = new Grid(previousState.grid.size, previousState.grid.cells);
        this.score = previousState.score;
        this.state = previousState.state
        this.keepPlaying = previousState.keepPlaying;
    }

    // Otherwise, begin a new game
    else {
        this.grid        = new Grid(size);
        this.score = 0;
        this.state = this.EARLY_GAME;
        this.keepPlaying = false;

        this.addStartTiles(2);
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
    if (this.state === this.JUST_LOST)
        this.storageManager.clearGameState();
    else
        this.storageManager.setGameState(this.serialize());

    // Pass the game's grid and metadata to the HTML actuator to draw a frame
    var metadata = {
        score:      this.score,
        won:        this.state === this.JUST_WON,
        lost:       this.state === this.JUST_LOST,
        bestScore:  this.storageManager.getBestScore(),
    }
    this.actuator.actuate(this.grid, metadata);
}
GameManager.prototype.addStartTiles = function (number) {
    // Set up the initial tiles to start the game with
    for (var i = 0; i < number; i++)
        this.grid.addRandomTile();
}

// FUNCTIONS
GameManager.prototype.serialize = function () {
    // Represent the current game as an object
    return {
        grid:        this.grid.serialize(),
        score:       this.score,
        lost:        this.lost,
        won:         this.won,
        keepPlaying: this.keepPlaying
    };
}
GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
}
GameManager.prototype.tileMatchesAvailable = function () {
    // Check for available matches between tiles (more expensive check)

    // For each cell on the grid...
    for (var x = 0; x < this.grid.size - 1; x++) {
        for (var y = 0; y < this.grid.size - 1; y++) {
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
    // Don't do anything if the game has ended
    if (this.state === this.JUST_LOST || this.state === this.JUST_WON)
        return;

    // Move tiles on the grid in the specified direction
    var tilesMoved = this.grid.didTilesMove(vector);
    if (!tilesMoved) return;

    // If tiles actually moved, then draw the next frame and return
    this.grid.addRandomTile();
    if (!this.movesAvailable())
        this.state = this.JUST_LOST;
    this.actuate();
    return;
}
GameManager.prototype.keepPlaying = function () {
    // Keep playing after winning (allows going over 2048)
    this.state = this.LATE_GAME;
    this.actuator.clearMessage();
}
GameManager.prototype.restart = function () {
    // Restart the game
    var gridSize = this.grid.size;
    this.storageManager.clearGameState();
    this.actuator.clearMessage();
    this.setup(gridSize);
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