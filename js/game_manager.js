// CONSTRUCTOR
function GameManager(size, InputManager, Actuator, StorageManager) {
    // Initialize properties
    this.size           = size; // Side length of the square grid
    this.inputManager   = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator       = new Actuator();
    this.startTiles     = 2;

    // Register game events
    this.inputManager.on("move",        this.move.bind(this));
    this.inputManager.on("restart",     this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

    // Setup the game
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
GameManager.prototype.restart = function () {
    // Restart the game
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();
}
GameManager.prototype.keepPlaying = function () {
    // Keep playing after winning (allows going over 2048)
    this.keepPlaying = true;
    this.actuator.continueGame(); // Clear the game won/lost message
}
GameManager.prototype.addStartTiles = function () {
    // Set up the initial tiles to start the game with
    for (var i = 0; i < this.startTiles; i++)
        this.addRandomTile();
}
GameManager.prototype.addRandomTile = function () {
    // Adds a tile in a random position
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
}
GameManager.prototype.actuate = function () {
    // Sends the updated grid to the actuator
    if (this.storageManager.getBestScore() < this.score)
        this.storageManager.setBestScore(this.score);

    // Clear the state when the game is over (game over only, not win)
    if (this.over)
        this.storageManager.clearGameState();
    else
        this.storageManager.setGameState(this.serialize());

    this.actuator.actuate(
        this.grid,
        {
            score: this.score,
            over: this.over,
            won: this.won,
            bestScore: this.storageManager.getBestScore(),
            terminated: this.isGameTerminated()
        }
    );
}
GameManager.prototype.prepareTiles = function () {
    // Save all tile positions and remove merger info
    this.grid.eachCell(function (x, y, tile) {
        if (tile) {
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
GameManager.prototype.move = function (direction) {
    // Move tiles on the grid in the specified direction

    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    // Don't do anything if the game's over
    if (this.isGameTerminated())
        return;

    var cell, tile;
    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = { x: x, y: y };
            tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                    // The mighty 2048 tile
                    if (merged.value === 2048) self.won = true;
                }
                else
                    self.moveTile(tile, positions.farthest);

                if (!self.positionsEqual(cell, tile))
                    moved = true; // The tile moved from its original cell!
            }
        });
    });

    if (moved) {
        this.addRandomTile();

        if (!this.movesAvailable())
            this.over = true; // Game over!

        this.actuate();
    }
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
    var traversals = { x: [], y: [] };

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
GameManager.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
            this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
}
GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
}
GameManager.prototype.tileMatchesAvailable = function () {
    // Check for available matches between tiles (more expensive check)
    var self = this;

    var tile;

    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            tile = this.grid.cellContent({ x: x, y: y });

            if (tile) {
                for (var direction = 0; direction < 4; direction++) {
                    var vector = self.getVector(direction);
                    var cell   = { x: x + vector.x, y: y + vector.y };

                    var other  = self.grid.cellContent(cell);

                    if (other && other.value === tile.value)
                        return true; // These two tiles can be merged
                }
            }
        }
    }

    return false;
}
GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
}