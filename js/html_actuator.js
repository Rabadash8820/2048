// CONSTRUCTOR
function HTMLActuator() {
    // Store some document elements
    this.tileContainer    = document.querySelector("div.tile-container");
    this.scoreContainer   = document.querySelector("div.score-container");
    this.bestContainer    = document.querySelector("div.best-container");
    this.messageContainer = document.querySelector("div.game-message");
    this.solverButton     = document.querySelector("a.solve-button");

    // Initialize the score
    this.score = 0;
}

// CLEAR METHODS
HTMLActuator.prototype.clearMessage = function () {
    // IE only takes one value to remove at a time.
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-lost");
}
HTMLActuator.prototype.clearContainer = function (container) {
    // Clear all HTML elements from the provided element
    while (container.firstChild !== null)
        container.removeChild(container.firstChild);
}

// DRAW METHODS
HTMLActuator.prototype.actuate = function (grid, metadata) {
    window.requestAnimationFrame(this.drawGameState.bind(this, grid, metadata));
}
HTMLActuator.prototype.drawGameState = function (grid, metadata) {
    // Update scores
    this.drawScore(metadata.score);
    this.drawBestScore(metadata.bestScore);

    // Update the game's tile grid
    this.clearContainer(this.tileContainer);
    for (var x = 0; x < grid.size; x++) {
        for (var y = 0; y < grid.size; y++) {
            var tile = grid.cells[x][y];
            if (tile === null) continue;
            this.drawTile(tile);
        }
    }

    // If the game is over then show an appropriate message
    if (metadata.lost)
        this.drawMessage(false); // Lose
    else if (metadata.won)
        this.drawMessage(true); // Win
}
HTMLActuator.prototype.drawTile = function (tile) {
    var outer = document.createElement("div");
    var inner = document.createElement("div");
    var position = (tile.previousPosition !== null) ? tile.previousPosition : { x: tile.x, y: tile.y };
    var positionClass = this.positionClass(position);

    // We can't use classlist because it somehow glitches when replacing classes
    var classes = ["tile", "tile-" + tile.value, positionClass];
    if (tile.value > 2048)
        classes.push("tile-super");
    outer.setAttribute("class", classes.join(" "));

    inner.classList.add("tile-inner");
    inner.textContent = tile.value;

    if (tile.previousPosition !== null) {
        // Make sure that the tile gets rendered in the previous position first
        window.requestAnimationFrame(function () {
            classes[2] = this.positionClass({ x: tile.x, y: tile.y });
            outer.setAttribute("class", classes.join(" "));
        }.bind(this));
    }
    else if (tile.mergedFrom !== null) {
        classes.push("tile-merged");
        outer.setAttribute("class", classes.join(" "));

        // Render the tiles that merged
        tile.mergedFrom.forEach(function (merged) {
            this.drawTile(merged);
        }.bind(this));
    }
    else {
        classes.push("tile-new");
        outer.setAttribute("class", classes.join(" "));
    }

    // Add the inner part of the tile to the wrapper
    outer.appendChild(inner);

    // Put the tile on the board
    this.tileContainer.appendChild(outer);
}
HTMLActuator.prototype.drawScore = function (score) {
    // Update the score text
    this.clearContainer(this.scoreContainer);
    var difference = score - this.score;
    this.score += difference;
    this.scoreContainer.textContent = this.score;

    // Display the little effect for points earned
    if (difference > 0) {
        var addition = document.createElement("div");
        addition.classList.add("score-addition");
        addition.textContent = "+" + difference;
        this.scoreContainer.appendChild(addition);
    }
}
HTMLActuator.prototype.drawBestScore = function (bestScore) {
    this.bestContainer.textContent = bestScore;
}
HTMLActuator.prototype.toggleSolver = function () {
    var text = this.solverButton.textContent;
    if (text === "Solve")
        this.solverButton.textContent = "Stop";
    if (text === "Stop")
        this.solverButton.textContent = "Solve";
}
HTMLActuator.prototype.drawMessage = function (won) {
    // Give the message HTML element the appropriate message and CSS class
    var endClass = won ? "game-won" : "game-lost";
    var message  = won ? "You win!" : "Game over!";
    this.messageContainer.classList.add(endClass);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
}

// HELPER METHODS
HTMLActuator.prototype.positionClass = function (position) {
    return "tile-position-" + position.x + "-" + position.y;
}
