// CONSTRUCTOR
function KeyboardInputManager() {
    // Dictionary that maps game event names to arrays of listeners
    this.events = {};

    // Dictionary that maps keycodes to movement directions
    this.map = {
        38: 0, // Up
        39: 1, // Right
        40: 2, // Down
        37: 3, // Left
        75: 0, // Vim up
        76: 1, // Vim right
        74: 2, // Vim down
        72: 3, // Vim left
        87: 0, // W
        68: 1, // D
        83: 2, // S
        65: 3, // A
    };

    // Add listeners for key presses, mouse clicks, and touches
    this.listen();
}

// METHODS TO REGISTER EVENT LISTENERS
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
    var restartButton = document.querySelector("a.retry-button, a.restart-button");
    var restartListener = this.emit.bind(this, "restart", undefined);
    restartButton.addEventListener("click", restartListener);
    restartButton.addEventListener(this.eventTouchend, restartListener);

    // Listen for clicks/presses on the Keep Playing button
    var playButton = document.querySelector("a.keep-playing-button");
    var playListener = this.emit.bind(this, "keepPlaying", undefined);
    playButton.addEventListener("click", playListener);
    playButton.addEventListener(this.eventTouchend, playListener);

    // Listen for clicks/presses that affect the Auto-Solver
    var incButton = document.querySelector("a.inc-speed-button");
    var decButton = document.querySelector("a.dec-speed-button");
    var incListener = this.emit.bind(this, "autoSolveSpeed", 1);
    var decListener = this.emit.bind(this, "autoSolveSpeed", -1);
    incButton.addEventListener("click", incListener);
    decButton.addEventListener("click", decListener);
    incButton.addEventListener(this.eventTouchend, incListener);
    decButton.addEventListener(this.eventTouchend, decListener);
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
        this.eventTouchmove = "MSPointerMove";
        this.eventTouchend = "MSPointerUp";
    }
    else {
        this.eventTouchstart = "touchstart";
        this.eventTouchmove = "touchmove";
        this.eventTouchend = "touchend";
    }
}

// EVENT LISTENERS
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
        this.emit.call(this, "autoSolveSpeed", 1, event);
    if (event.which === 109)
        this.emit.call(this, "autoSolveSpeed", -1, event);
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

    // If the absolute delta-x or delta-y of this swipe was large enough, then emit the corresponding move event
    var dx = touchEndClientX - this.touchStartClientX;
    var dy = touchEndClientY - this.touchStartClientY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) > 10) {
        var direction = (absDx > absDy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);    // (right : left) : (down : up)
        this.emit.call(this, "move", direction, event);
    }
}

// METHODS TO EMIT/REGISTER GAME EVENTS
KeyboardInputManager.prototype.on = function (name, listener) {
    if (!this.events.hasOwnProperty(name))
        this.events[name] = [];
    this.events[name].push(listener);
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