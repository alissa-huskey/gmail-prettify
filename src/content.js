log = function(...args) {
  console.log("gmail-prettify> " + args.join(" "))
}

log("gmail-prettify> content.js")

Prettify = function() {
  // colors and such
  let inbox_icon = "https://www.gstatic.com/images/icons/material/system/2x/inbox_black_20dp.png";
  let near_black = "#202124";
  let near_white = "#fbfbfb";
  let dark_gray = "#aaa";

  // DOM elements
  this.elms = {}

  // ------------------------------------------------------------------------
  // check if <a title="Inbox"/> is defined to determine if Gmail is loaded
  //   otherwise set a timeout to try again
  // ------------------------------------------------------------------------
  this.isReady = function() {
    if(this.elms.inbox_a === false) {
      log("still waiting for gmail to load")
      setTimeout(this.stylePage.bind(this), 1000);
      return false
    }
    return true
  }

  // ------------------------------------------------------------------------
  // return true if gmail page in activeTab has a sidebar
  // ------------------------------------------------------------------------
  this.hasSidebar = function() {
    let logExit = function(desc, view) {
      log("on", desc," page (", view, "). exiting");
    }

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
  }

  // ------------------------------------------------------------------------
  // gather DOM elements
  // ------------------------------------------------------------------------
  this.getElements = function() {
    log("getting DOM elements")

    // the Inbox <a /> element -- used to find all the other elements
    this.elms.inbox_a = document.querySelector("a[title='Inbox']");

    // sanity check
    if(!this.isReady()) {
      return
    }

    // a local elms object for brevity sake
    let elms = { inbox_a: this.elms.inbox_a }

    // the div for the numbeer of unread messages
    elms.unread_div = elms.inbox_a.parentElement.nextElementSibling

    // the Meet / Chat section of the sidebar
    elms.chat_div = document.querySelector("div[aria-label='Hangouts']");

    // the inbox sidebar link div
    elms.inbox_div = elms.inbox_a.parentElement.parentElement.parentElement.parentElement;

    // the inbox icon div
    elms.icon_div = elms.inbox_a.parentElement.parentElement.previousSibling;

    // the sidebar div containg links to Inbox, Trash, labels, etc
    elms.folders_div = elms.inbox_a.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;

    // the entire sidebar
    elms.sidebar_div = elms.folders_div.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;

    this.elms = elms
  }

  // ----------------------------------------------------------
  // modify the DOM
  // ----------------------------------------------------------
  this.stylePage = function() {
    this.getElements()

    // sanity check
    if(!this.isReady()) {
      return
    }

    log("styling...")

    // set the inbox sidebar link colors and style
    this.elms.inbox_a.style.color = near_black;
    this.elms.unread_div.style.color = near_black;
    this.elms.inbox_div.style.backgroundColor = near_white;
    this.elms.inbox_div.style.boxShadow = "inset 0 0 0 1px " + dark_gray;
    this.elms.icon_div.style.backgroundImage = "url('" + inbox_icon + "')";

    // hide the hangouts interface
    this.elms.chat_div.style.display = "none";

    // set the height of the folders div to take up the whole sidebar
    this.elms.folders_div.style.height = this.elms.sidebar_div.style.height;

    log("done.")
  }

  // ------------------------------------------------------------------------
  // once gmail has loaded, trigger stylePage() and set up listeners
  //   this is on a setInterval() timer triggered from run()
  // ------------------------------------------------------------------------
  init = function() {
    log("attempting initialization")
    let call_icon = document.querySelector('div[aria-label="Phone calls"]');

    if(call_icon === false) {
      log("waiting for gmail to load")
    } else {
      log("gmail finished loading")
      clearInterval(this.gmailLoaded);

      this.stylePage()

      window.addEventListener("resize", function(){
        log("restyling after a window resize")
        this.stylePage()
      }.bind(this));

      log("fin")
    }
  }

  // ------------------------------------------------------------------------
  // do all the things
  // ------------------------------------------------------------------------
  this.run = function(callback) {
    log("hello.");

    if(!this.hasSidebar()) {
      log("no sidebar, refusing to continue");
      return
    }

    this.gmailLoaded = setInterval(init.bind(this), 1000);
  }

  // ------------------------------------------------------------------------
  // if programmer forgot to call new Prettier, do it for them
  // ------------------------------------------------------------------------
  if (!new.target) {
    return new Prettier();
  }
}
var ext = new Prettify()

// ------------------------------------------------------------------------
// trigger the extension once the page is ready
// ------------------------------------------------------------------------
chrome.extension.sendMessage({}, function(response) {
	var docReady = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(docReady);
      ext.run()
    }
	}, 50);
});
