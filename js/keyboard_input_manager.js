// CONSTRUCTOR
function KeyboardInputManager() {
    // Dictionary that maps game event names to arrays of listeners
    this.events = {};

    // Dictionary that maps keycodes to movement directions
    this.map = {
        38: { x: 0,  y: -1 }, // Up
        39: { x: 1,  y: 0  }, // Right
        40: { x: 0,  y: 1  }, // Down
        37: { x: -1, y: 0  }, // Left
        75: { x: 0,  y: -1 }, // Vim up
        76: { x: 1,  y: 0  }, // Vim right
        74: { x: 0,  y: 1  }, // Vim down
        72: { x: -1, y: 0  }, // Vim left
        87: { x: 0,  y: -1 }, // W
        68: { x: 1,  y: 0  }, // D
        83: { x: 0,  y: 1  }, // S
        65: { x: -1, y: 0  }, // A
    };

    // Add listeners for key presses, mouse clicks, and touches
    this.listen();
}

// METHODS TO REGISTER INPUT EVENT LISTENERS
KeyboardInputManager.prototype.listen = function () {
    // Add listeners for key presses
    this.listenForKeys();

    // Add listeners for touch/mouse presses and touch swipes
    this.defineTouchEvents();
    this.listenForPress();
    this.listenForSwipe();
}
KeyboardInputManager.prototype.listenForKeys = function () {
    document.addEventListener("keydown", this.keyDownListener.bind(this));
}
KeyboardInputManager.prototype.listenForPress = function () {
    // Listen for clicks/presses that restart the game
    var retryButton = document.querySelector("a.retry-button");
    var restartButton = document.querySelector("a.restart-button");
    var restartListener = this.emit.bind(this, "restart", undefined);
    restartButton.addEventListener("click", restartListener);
    retryButton.addEventListener("click", restartListener);
    restartButton.addEventListener(this.eventTouchend, restartListener);
    retryButton.addEventListener(this.eventTouchend, restartListener);

    // Listen for clicks/presses on the Keep Playing button
    var playButton = document.querySelector("a.keep-playing-button");
    var playListener = this.emit.bind(this, "keepPlaying", undefined);
    playButton.addEventListener("click", playListener);
    playButton.addEventListener(this.eventTouchend, playListener);

    // Listen for clicks/presses that affect the Solver's speed
    var incButton = document.querySelector("a.inc-speed-button");
    var decButton = document.querySelector("a.dec-speed-button");
    var incListener = this.emit.bind(this, "solverSpeed", 1);
    var decListener = this.emit.bind(this, "solverSpeed", -1);
    incButton.addEventListener("click", incListener);
    decButton.addEventListener("click", decListener);
    incButton.addEventListener(this.eventTouchend, incListener);
    decButton.addEventListener(this.eventTouchend, decListener);

    // Listen for clicks/presses that invoke the Solver
    var solveButton = document.querySelector("a.solve-button");
    var stepButton = document.querySelector("a.step-button");
    var solveListener = this.emit.bind(this, "toggleSolver", undefined);
    var stepListener = this.emit.bind(this, "stepSolver", undefined);
    solveButton.addEventListener("click", solveListener);
    stepButton.addEventListener("click", stepListener);
    solveButton.addEventListener(this.eventTouchend, solveListener);
    stepButton.addEventListener(this.eventTouchend, stepListener);
}
KeyboardInputManager.prototype.listenForSwipe = function () {
    // Register listeners for swipe events with the game container
    var gameContainer = document.querySelector("div.game-container");
    gameContainer.addEventListener(this.eventTouchstart, this.touchStartListener.bind(this));
    gameContainer.addEventListener(this.eventTouchmove,  this.touchMoveListener.bind(this));
    gameContainer.addEventListener(this.eventTouchend,   this.touchEndListener.bind(this));
}
KeyboardInputManager.prototype.defineTouchEvents = function () {
    // Define touch events based on player's browser
    if (window.navigator.msPointerEnabled) {
        //Internet Explorer 10 style
        this.eventTouchstart = "MSPointerDown";
        this.eventTouchmove  = "MSPointerMove";
        this.eventTouchend   = "MSPointerUp";
    }
    else {
        this.eventTouchstart = "touchstart";
        this.eventTouchmove  = "touchmove";
        this.eventTouchend   = "touchend";
    }
}

// INPUT EVENT LISTENERS
KeyboardInputManager.prototype.keyDownListener = function (event) {
    // If the player pressed a modifier key then just return
    var modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    if (modifiers) return;

    // If a direction key was pressed, then emit the corresponding move event
    var direction = this.map[event.which];
    if (direction !== undefined)
        this.emit.call(this, "move", direction, event);

    // R key restarts the game
    if (event.which === 82)
        this.emit.call(this, "restart", undefined, event);

    // Plus/minus keys control the auto-solver's speed
    if (event.which === 107)
        this.emit.call(this, "solverSpeed", 1, event);
    if (event.which === 109)
        this.emit.call(this, "solverSpeed", -1, event);
}
KeyboardInputManager.prototype.touchStartListener = function (event) {
    // If player is touching with more than 1 finger then just return
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) || event.targetTouches > 1)
        return;

    // Otherwise, store their fingers' coordinates
    if (window.navigator.msPointerEnabled) {
        this.touchStartClientX = event.pageX;
        this.touchStartClientY = event.pageY;
    }
    else {
        this.touchStartClientX = event.touches[0].clientX;
        this.touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
}
KeyboardInputManager.prototype.touchMoveListener = function (event) {
    event.preventDefault();
}
KeyboardInputManager.prototype.touchEndListener = function (event) {
    // If player is still touching with more than 1 finger then just return
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) || event.targetTouches > 0)
        return;

    // Otherwise, store their fingers' coordinates
    var touchEndClientX, touchEndClientY;
    if (window.navigator.msPointerEnabled) {
        touchEndClientX = event.pageX;
        touchEndClientY = event.pageY;
    }
    else {
        touchEndClientX = event.changedTouches[0].clientX;
        touchEndClientY = event.changedTouches[0].clientY;
    }

    // If the absolute delta-x or delta-y of this swipe was large enough,
    // then emit a move event in the corresponding direction
    var dx = touchEndClientX - this.touchStartClientX;
    var dy = touchEndClientY - this.touchStartClientY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) > 10) {
        var x = (absDx > absDy) ? this.sign(dx) : 0;
        var y = (absDy > absDx) ? this.sign(dy) : 0;
        this.emit.call(this, "move", { x: x, y: y }, event);
    }
}

// METHODS TO EMIT/REGISTER GAME EVENTS
KeyboardInputManager.prototype.on = function (listener) {
    // Add the listener to every provided event
    if (arguments.length <= 1) return;
    for (var arg = 1; arg < arguments.length; ++arg) {
        var name = arguments[arg];
        if (!this.events.hasOwnProperty(name))
            this.events[name] = [];
        this.events[name].push(listener);
    }
}
KeyboardInputManager.prototype.emit = function (gameEventName, data, inputEvent) {
    // The input event is being handled, so prevent its default action
    inputEvent.preventDefault();

    // If this event does not have any listeners then just return
    if (!this.events.hasOwnProperty(gameEventName)) return;
    var listeners = this.events[gameEventName];
    if (listeners.length === 0) return;

    // Otherwise, call each listener
    listeners.forEach(function (listener) {
        listener(data);
    });
}

// HELPER FUNCTIONS
KeyboardInputManager.prototype.sign = function (value) {
    if (value < 0) return -1;
    else if (value > 0) return 1;
    else return 0;
}
