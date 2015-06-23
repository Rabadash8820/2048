// CONSTRUCTOR
function Tile(position, value) {
  this.x                = position.x;
  this.y                = position.y;
  this.value            = (value !== undefined) ? value : 2;
  this.previousPosition = null;
  this.mergedFrom       = null; // Tracks tiles that merged together
}

// METHODS
Tile.prototype.serialize = function () {
    return {
        position: {
            x: this.x,
            y: this.y
        },
        value: this.value
    };
};