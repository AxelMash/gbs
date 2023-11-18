/**
 * GameCheese Engine
 *
 * This file is intended to be side-loaded into a web browser by typing something similar to the following into the URL bar or via bookmark:
 *
 * ```
 * javascript: (function() {
 *   var script = document.createElement("script");
 *   script.setAttribute('src', 'https://andrewvaughan.github.io/game-cheese/CheeseEngine.js');
 *   script.setAttribute('type', 'text/javascript');
 *   script.setAttribute('data-game', '<<GAME-NAME-HERE>>');
 *   document.querySelector("body").appendChild(script);
 * })();
 * ```
 *
 * This can also be entered into the console by removing the `javascript:` in the beginning.
 *
 * NO LICENSE, WARRANTY, OR LIABILITY IS PROVIDED FOR USING GAMECHEESE, IN WHOLE OR IN PART, IN ANY WAY.
 */


/**
 * Base class for all CheeseEngines.
 *
 * Provides various utility functions and elements across all game engines.
 */
class CheeseEngine {

  /**
   * The interval (in ms) to call the `update()` method.
   */
  _updateInterval = 500;

  /**
   * The handle for the update timer.
   */
  _updateHandle = null;

  /**
   * The settings menu element.
   */
  _settingsMenu = null;

  
  /**
   * Create a new CheeseEngine.
   *
   * @param {bool} autoStart - whether to automatically start the engine after loading
   */
  constructor(autoStart = true, updateInterval = 500) {
    this._debug("Initializing CheeseEngine...");
    
    this._updateInterval = updateInterval;

    // TODO - Turn this into a promise and create a load chain for all sub-engines (loadStyles->loadScripts->autoStart)
    this._loadStyle("https://andrewvaughan.github.io/game-cheese/style.css");
    this._createUI();

    // Autostart
    if (autoStart) {
      this.start();
	  this.forceFocusOnElement();
    }
  }
	forceFocusOnElement() {
	  const targetElement = document.getElementById("id_del_tuo_elemento"); // Sostituisci con l'id del tuo elemento
	  if (targetElement) {
		targetElement.focus();
  
  /**
   * Start the CheeseEngine routine.
   */
  start() {
    this._debug("Starting engine...");
    
    this._updateHandle = setInterval(
      
      function() {
        this.update();
      }.bind(this),
      
      this._updateInterval
    );
  }

  
  /**
   * Stop the CheeseEngine routeine.
   */
  stop() {
    this._debug("Stopping engine...");
    clearInterval(this._updateHandle);
  }


  /**
   * Triggered repeatedly as part of the run routine.
   *
   * This method should be overridden in any engine to perform periodic logic.
   */
  update() {
    // Overridden in engines
  }


  /**
   * Open the settings menu.
   */
  openMenu() {
    const elem = document.getElementById("cheese-menu");
    
    elem.style.visibility = "visible";
  	elem.style.transform = "translate(0%)";
  }


  /**
   * Close the settings menu.
   */
  closeMenu() {
  	document.getElementById("cheese-menu").style.transform = "translate(110%)";
  }
  
  
  /**
   * Create the UI for Cheese Engine.
   *
   * Sets up the sliding side menu and controls for engines to manage.
   */
  _createUI() {

    // Menu button and animation
    const menuButton = document.createElement("div");
    menuButton.id = "cheese-menu-button";
    menuButton.onclick = function() {
      this.openMenu();
    }.bind(this);

    const menuButtonImg = document.createElement("img");
    menuButtonImg.setAttribute("src", "https://andrewvaughan.github.io/game-cheese/img/cheese-icon-200x174.png");
    menuButton.appendChild(menuButtonImg);

    const menuButtonMarqueeContainer = document.createElement("div");
    menuButtonMarqueeContainer.id = "cheese-menu-message";

    const menuButtonMarquee = document.createElement("span");
    menuButtonMarquee.innerHTML = "GameCheese is running!";
    menuButtonMarqueeContainer.appendChild(menuButtonMarquee);

    menuButton.appendChild(menuButtonMarqueeContainer);
    
    document.body.appendChild(menuButton);

    // Menu
    const cheeseMenu = document.createElement("div");
    cheeseMenu.id = "cheese-menu";

    const cheeseMenuHeader = document.createElement("div");
    cheeseMenuHeader.classList.add("cheese-menu-header");
    cheeseMenu.appendChild(cheeseMenuHeader);

    const cheeseMenuCloseImg = document.createElement("img");
    cheeseMenuCloseImg.id = "cheese-menu-close";
    cheeseMenuCloseImg.setAttribute("src", "https://andrewvaughan.github.io/game-cheese/img/x-48x48.png");
    cheeseMenuCloseImg.onclick = function() {
      this.closeMenu();
    }.bind(this);
    cheeseMenuHeader.appendChild(cheeseMenuCloseImg);

    const cheeseMenuHeaderHead = document.createElement("div");
    cheeseMenuHeaderHead.classList.add("cheese-menu-header");
    cheeseMenuHeaderHead.innerHTML = "CheeseEngine";
    cheeseMenuHeader.appendChild(cheeseMenuHeaderHead);

    this._settingsMenu = document.createElement("div");
    this._settingsMenu.id = "cheese-settings";
    cheeseMenu.appendChild(this._settingsMenu);

    document.body.appendChild(cheeseMenu);


    // Let sub-engines create their own settings
    this._createSettingsUI(this._settingsMenu);
    
  }


  /**
   * Create the settings menu for a game.
   */
  _createSettingsUI(settings) {

    const noSettings = document.createElement("em");
    noSettings.innerHTML = "This game has no configurable settings.";
    settings.appendChild(noSettings);
    
  }
  

  /**
   * Log a debug message.
   *
   * @param {string} msg - the message to log
   */
  _debug(msg) {
    console.debug(`[GameCheese] ${msg}`);
  }
  

  /**
   * Log an informative message.
   *
   * @param {string} msg - the message to log
   */
  _log(msg) {
    console.log(`[GameCheese] ${msg}`);
  }


  /**
   * Log a warning.
   *
   * @param {string} msg - the message to log
   */
  _warning(msg) {
    console.warn(`[GameCheese] WARNING :: ${msg}`);
  }


  /**
   * Log an error.
   *
   * @param {string} msg - the message to log
   */
  _error(msg) {
    console.error(`[GameCheese] ERROR :: ${msg}`);
  }


  /**
   * Loads a CSS file into the DOM.
   *
   * @param {string} url - the URL to load in to the DOM
   * @param {function} callback - the callback to call when loaded, if any
   */
  _loadStyle(url, callback = null) {
    this._debug(`Loading CSS file: ${url}`);

    const link = document.createElement("link");

    link.setAttribute("href", url);
    link.setAttribute("type", "text/css");
    link.setAttribute("rel", "stylesheet");

    link.addEventListener("load", () => {
      this._debug(`Loaded CSS file successfully: ${url}`);

      if (typeof callback == "function") {
        callback();
      }
    });

    link.addEventListener("error", (ev) => {
      this._warning(`Encountered error loading CSS file: ${url}`, ev);
    });

    document.querySelector("head").appendChild(link);
  }


  /**
   * Return an element given an xpath.
   *
   * @param {string} xpath - the xpath to search
   *
   * @return the element found at the xpath or undefined
   */
  _getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }
  
}



// Attempt to load the game being requested
let gameCheese = null;

(() => {

  const cheeseScript = document.evaluate(
    "//script[contains(@src, 'CheeseEngine.js')]",
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  const cheeseGame = cheeseScript.getAttribute("data-game");
  
  if (!cheeseGame) {
    console.error("No game name was provided for GameCheese to load; exiting early.");
    return;
  }

  
  let cheeseScriptElem = document.createElement("script");
  
  cheeseScriptElem.setAttribute("src", `https://andrewvaughan.github.io/game-cheese/${encodeURIComponent(cheeseGame)}/Cheese.js`);
  cheeseScriptElem.setAttribute("type", "text/javascript");
  
  cheeseScriptElem.addEventListener("load", () => {
    console.log(`GameCheese loaded successfully for game '${cheeseGame}'.`);
  });
  
  cheeseScriptElem.addEventListener("error", (ev) => {
    console.error(`GameCheese encountered an error loading '${cheeseGame}'.`), ev;
  });
  
  document.body.appendChild(cheeseScriptElem);
  
})();
