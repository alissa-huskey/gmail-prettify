// ------------------------------------------------------------------------
// return the current time in format "m/d/yyyy H:M ap"
// ------------------------------------------------------------------------
function time() {
  let now = new Date();
  let hours = now.getHours();
  let mins = now.getMinutes().toString();
  return [
    hours > 12 ? hours-12 : hours,     ":",
    mins.length < 2 ? "0"+mins : mins,
    hours > 12 ? "pm": "am"
  ].join("");
}

// ------------------------------------------------------------------------
// calls a console message function
// ------------------------------------------------------------------------
function log(level, ...args) {
  let valid = [ "debug", "info", "error", "info", "log", "warn" ];
  if(!valid.includes(level)) {
    log("error", "Invalid log level called:", level, args);
    return;
  }

  console[level]("gmail-prettify", time() + ">", args.join(" "));
}

// ------------------------------------------------------------------------
// console.debug(...)
// ------------------------------------------------------------------------
function debug(...args) {
  log("debug", args);
}

// ------------------------------------------------------------------------
// console.info(...)
// ------------------------------------------------------------------------
function info(...args) {
  log("info", args);
}

// ------------------------------------------------------------------------
// console.warn(...)
// ------------------------------------------------------------------------
function warn(...args) {
  log("warn", args);
}

// ------------------------------------------------------------------------
// console.error(...)
// ------------------------------------------------------------------------
function error(...args) {
  log("error", args);
}

info("Gmail Prettify -------------------------------------------------------------");

Prettify = function() {
  // colors and such
  let inbox_icon = "https://www.gstatic.com/images/icons/material/system/2x/inbox_black_20dp.png";
  let near_black = "#202124";
  let near_white = "#fbfbfb";
  let dark_gray = "#aaa";

  // DOM elements
  this.elms = {};

  // ------------------------------------------------------------------------
  // check if <a title="Inbox"/> is defined to determine if Gmail is loaded
  //   otherwise set a timeout to try again
  // ------------------------------------------------------------------------
  this.gmailReady = function() {
    // great it's already defined
    if(this.elms.inbox_a != null) {
      debug("gmail is Ready");
      return true;
    }

    this.elms.inbox_a = document.querySelector("a[title='Inbox']");
    if(this.elms.inbox_a == null) {
      debug("still waiting for gmail to load");
      return false;
    }
    debug("gmail is now Ready");
    return true;
  };

  // ------------------------------------------------------------------------
  // return true if gmail page in activeTab has a sidebar
  // ------------------------------------------------------------------------
  this.hasSidebar = function() {
    let logExit = function(desc, view) {
      info("on", desc," page (", view, "). exiting");
    };

    // the btop view -- standalone email window:
    //   https://mail.google.com/mail/u/0/?ui=2&view=btop&ver=1nnj51jn5rorm&search=inbox&th=1566105b2f12efcb&cvid=3
    if(window.location.search.indexOf('view=btop') !== -1) {
      logExit("standalone email", "btop");
      return false;
    }

    // the cm view -- standalone compose window:
    //   https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1
    //   https://mail.google.com/mail/u/0/?ui=2&view=btop&ver=1nnj51jn5rorm#cmid%253D1
    if(window.location.search.indexOf('view=cm') !== -1) {
      logExit("dedicated compose", "cm");
      return false;
    }

    // basic HTML mode:
    //   https://mail.google.com/mail/u/0/h/1vmp7nf0qy3p7/?zy=d&f=1
    if(window.location.pathname.indexOf('/h/') !== -1) {
      logExit("basic HTML", "/h/");
      return false;
    }

    return true;
  };

  // ------------------------------------------------------------------------
  // gather DOM elements
  // ------------------------------------------------------------------------
  this.getElements = function() {
    console.debug("gmail-prettier> getting DOM elements");

    // a local elms object for brevity sake
    let elms = {};

    // the Inbox <a /> element -- used to find all the other elements
    elms.inbox_a = document.querySelector("a[title='Inbox']");

    if(elms.inbox_a === null) {
      console.debug("gmail-prettier> getElements(): gmail not yet loaded");
      return elms;
    }

    // the div for the numbeer of unread messages
    elms.unread_div = elms.inbox_a.parentElement.nextElementSibling;

    // the Meet / Chat section of the sidebar
    elms.chat_div = document.querySelector("div[aria-label='Hangouts']");

    // the inbox sidebar link div
    elms.inbox_div = elms.inbox_a.parentElement.parentElement.parentElement.parentElement;

    // the inbox icon div
    elms.icon_div = elms.inbox_a.parentElement.parentElement.previousSibling;

    // the sidebar div containg links to Inbox, Trash, labels, etc
    elms.folders_div = elms.inbox_a.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
    if(elms.folders_div.id == "") {
      elms.folders_div.id = "GP_FOLDERS_DIV";
    }

    // the entire sidebar
    elms.sidebar_div = elms.folders_div.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;

    return elms;
  };

  // ----------------------------------------------------------
  // hide the chat div and resize the folders div
  // ----------------------------------------------------------
  this.resize = function() {
    // win the race condition with gmail resizing onClick
    setTimeout(function(){
      if(!this.gmailReady()) {
        error("resize:", "gmail not fully loaded yet");
        return;
      }

      info("resizing");
      clearInterval(this.resizeDone);

      // hide the hangouts interface
      this.elms.chat_div.style.display = "none";
      this.elms.chat_div.style.height = 0;

      // set the height of the folders div to take up the whole sidebar
      this.elms.folders_div.style.height = this.elms.sidebar_div.style.height;

      debug("resize: done");

    }.bind(this), 250);
  };

  // ----------------------------------------------------------
  // redraw and resize as needed
  // ----------------------------------------------------------
  this.refresh = function() {
    debug("refresh: begin");
    clearInterval(this.refreshDone);

    if(this.elms.inbox_a.style.color != near_black) {
      this.redraw();
    }

    if(this.elms.folders_div.style.height != this.elms.sidebar_div.style.height) {
      this.resize();
    }

    info("refresh: done");
  };

  // ----------------------------------------------------------
  // set the inbox link colors and style
  // ----------------------------------------------------------
  this.redraw = function() {
    debug("redraw: begin");
    clearInterval(this.redrawDone);

    // set the colors and styles
    this.elms.inbox_a.style.color = near_black;
    this.elms.unread_div.style.color = near_black;
    this.elms.inbox_div.style.backgroundColor = near_white;
    this.elms.inbox_div.style.boxShadow = "inset 0 0 0 1px " + dark_gray;
    this.elms.icon_div.style.backgroundImage = "url('" + inbox_icon + "')";

    info("redraw: done");
  };

  // ------------------------------------------------------------------------
  // inject DOM elements into the page for debugging
  // ------------------------------------------------------------------------
  this.inject = function() {
    let script = document.createElement('script');
    script.textContent = 'function prettierDebug() { return ' + this.getElements + '(); };';
    (document.head||document.documentElement).appendChild(script);
  };

  // ------------------------------------------------------------------------
  // once gmail has loaded, trigger redraw() and set up listeners
  //   this is on a setInterval() timer triggered from run()
  // ------------------------------------------------------------------------
  this.init = function() {
    debug("init: begin");
    let call_icon = document.querySelector('div[aria-label="Phone calls"]');
    let inbox_a = document.querySelector("a[title='Inbox']");

    if(call_icon === false || inbox_a === false) {
      debug("waiting for gmail to load");
    } else {
      debug("gmail finished loading");
      clearInterval(this.gmailLoaded);

      this.elms = this.getElements();
      this.inject();

      this.refreshDone = setInterval(this.refresh.bind(this), 500);
      this.watcherReady = setInterval(this.watch.bind(this), 500);

      debug("init: done");
    }
  };

  // ------------------------------------------------------------------------
  // set up observers
  // ------------------------------------------------------------------------
  this.watch = function() {
    debug("watch: begin");

    div = document.querySelector("div#GP_FOLDERS_DIV");

    if(div == null) {
      debug("watch: still waiting for GP_FOLDERS_DIV id.");
      return;
    }

    clearInterval(this.watcherReady);

    this.resizer = new ResizeObserver(this.refresh.bind(this));
    this.resizer.observe(div);

    this.mutator = new MutationObserver(this.refresh.bind(this));
    this.mutator.observe(div, { childList: true });

    debug("watch: observers are watching");
  };

  // ------------------------------------------------------------------------
  // do all the things
  // ------------------------------------------------------------------------
  this.run = function(callback) {
    info("hello.");

    if(!this.hasSidebar()) {
      info("no sidebar, refusing to continue");
      return;
    }

    this.gmailLoaded = setInterval(this.init.bind(this), 1000);
  };

  // ------------------------------------------------------------------------
  // if programmer forgot to call new Prettier, do it for them
  // ------------------------------------------------------------------------
  if (!new.target) {
    return new Prettier();
  }
};

var ext = new Prettify();

// ------------------------------------------------------------------------
// trigger the extension once the page is ready
// ------------------------------------------------------------------------
chrome.extension.sendMessage({}, function(response) {
	var docReady = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(docReady);
      ext.run();
    }
	}, 50);
});
