// CONSTRUCTOR
function LocalStorageManager() {
    this.bestScoreKey = "bestScore";
    this.gameStateKey = "gameState";

    // If local web storage is not supported then use a "fakeStorage" object to simulate it
    var supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : window.fakeStorage;
}

// OBJECT TO SIMULATE LOCAL WEB STORAGE
window.fakeStorage = {
    _data: {},
    setItem:    function (id, val) {
        this._data[id] = String(val);
    },
    getItem:    function (id) {
        return this._data.hasOwnProperty(id) ? this._data[id] : null;
    },
    removeItem: function (id) {
        delete this._data[id];
    },
    clear:      function () {
        this._data = {};
    }
};

// DETERMINES IF LOCAL WEB STORAGE IS SUPPORTED
LocalStorageManager.prototype.localStorageSupported = function () {
    // Check whether local web storage is supported by attempting to store some test data
    try {
        var testKey = "test";
        var storage = window.localStorage;
        storage.setItem(testKey, "1");
        storage.removeItem(testKey);
        return true;
    }
    catch (error) {
        return false;
    }
}

// BEST SCORE GETTERS/SETTERS
LocalStorageManager.prototype.getBestScore = function () {
    var score = this.storage.getItem(this.bestScoreKey);
    return (score !== null) ? score : 0;
}
LocalStorageManager.prototype.setBestScore = function (score) {
  this.storage.setItem(this.bestScoreKey, score);
}

// GAME STATE GETTERS/SETTERS
LocalStorageManager.prototype.getGameState = function () {
    var stateJSON = this.storage.getItem(this.gameStateKey);
    return JSON.parse(stateJSON);
}
LocalStorageManager.prototype.setGameState = function (gameState) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
}
LocalStorageManager.prototype.clearGameState = function () {
    this.storage.removeItem(this.gameStateKey);
}
