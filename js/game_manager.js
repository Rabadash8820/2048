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

// GAME EVENT LISTENERS
GameManager.prototype.move = function (vector) {
    // Don't do anything if the game has ended
    if (this.state === this.JUST_LOST || this.state === this.JUST_WON)
        return;

    // Move tiles on the grid in the specified direction and determine the resulting score increment
    var delta = this.grid.scoreDeltaFromSwipe(vector);
    if (delta === -1) return;
    
    // Update the score and game state
    this.score += delta;
    if (delta >= 2048) this.state = this.JUST_WON;

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

// HELPER FUNCTIONS
GameManager.prototype.serialize = function () {
    // Represent the current game as an object
    return {
        grid: this.grid.serialize(),
        score: this.score,
        lost: this.lost,
        won: this.won,
        keepPlaying: this.keepPlaying
    };
}
GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.grid.tileMatchesAvailable();
}
