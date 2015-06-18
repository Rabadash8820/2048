// Wait till the browser is ready to render the game (avoids glitches)
// Start new instance of GameManager, passing constructors of manager objects
window.requestAnimationFrame(function () {
  new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});