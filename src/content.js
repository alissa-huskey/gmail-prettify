// log a message to the console
function log(message) {
  console.log("gmail-prettify> " + message)
}

// check if elm is defined to determine of page is ready
// otherwise set a timeout to try stylePage() again
function isReady(elm) {
  if(elm == null) {
    log("still waiting for gmail to load")
    setTimeout(stylePage, 1000);
    return false
  }

  return true
}

// check for pages without a sidebar
function shouldLoad() {
  var logExit = function(desc, view) {
    log("on " + desc + " page (" + view + "). exiting");
  }

  // Gmail users can open email messages in a new window. The loads a special view
  // called btop. The URL looks something like this:
  //
  //   https://mail.google.com/mail/u/0/?ui=2&view=btop&ver=1nnj51jn5rorm&search=inbox&th=1566105b2f12efcb&cvid=3

  if(window.location.search.indexOf('view=btop') !== -1) {
    logExit("standalone email", "btop");
    return false;
  }

  // Gmail also has a dedicated compose view. URLs look like this:
  //
  //   https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1
  //   https://mail.google.com/mail/u/0/?ui=2&view=btop&ver=1nnj51jn5rorm#cmid%253D1

  if(window.location.search.indexOf('view=cm') !== -1) {
    logExit("dedicated compose", "cm");
    return false;
  }

  // Gmail has a basic HTML mode. URLs look like this:
  //
  //   https://mail.google.com/mail/u/0/h/1vmp7nf0qy3p7/?zy=d&f=1

  if(window.location.pathname.indexOf('/h/') !== -1) {
    logExit("basic HTML", "/h/");
    return false;
  }

  return true;
}

// initialize the extension
function init() {
  log("init()")

  var loaded = setInterval(function() {
    log("waiting for gmail to load")

    var call_icon = document.querySelector('div[aria-label="Phone calls"]');

    if(call_icon !== false) {
      log("gmail finished loading")
      clearInterval(loaded);

      stylePage()

      window.addEventListener("resize", function(){
        log("restyling after a window resize")
        stylePage()
      });

      log("done initializing")
    }
  }, 1000);
}

// modify the style here
function stylePage() {
  log("styling...")

  // ----------------------------------------------------------
  // gather the dom elements
  // ----------------------------------------------------------

  // the Inbox <a /> element -- used to find all the other elements
  var inbox_a = document.querySelector("a[title='Inbox']");

  // sanity check
  if(!isReady(inbox_a)) {
    return
  }

  // set some colors and style
  var inbox_icon = "https://www.gstatic.com/images/icons/material/system/2x/inbox_black_20dp.png";
  var near_black = "#202124";
  var near_white = "#fbfbfb";
  var dark_gray = "#aaa";

  // the div for the numbeer of unread messages
  var unread_div = inbox_a.parentElement.nextElementSibling

  // the Meet / Chat section of the sidebar
  var chat_div = document.querySelector("div[aria-label='Hangouts']");

  // the inbox sidebar link div
  var inbox_div = inbox_a.parentElement.parentElement.parentElement.parentElement;

  // the inbox icon div
  var icon_div = inbox_a.parentElement.parentElement.previousSibling;

  // the sidebar div containg links to Inbox, Trash, labels, etc
  var folders_div = inbox_a.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;

  // the entire sidebar
  var sidebar_div = folders_div.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;

  // ----------------------------------------------------------
  // modify the DOM
  // ----------------------------------------------------------

  // set the inbox sidebar link to be near-black on near-white
  inbox_a.style.color = near_black;
  unread_div.style.color = near_black;
  inbox_div.style.backgroundColor = near_white;
  inbox_div.style.boxShadow = "inset 0 0 0 1px " + dark_gray;
  icon_div.style.backgroundImage = "url('" + inbox_icon + "')";

  // set the height of the folders div to take up the whole sidebar
  folders_div.style.height = sidebar_div.style.height;

  // hide the hangouts interface
  chat_div.style.display = "none";

  log("done.")
}

// trigger the extension load
chrome.extension.sendMessage({}, function(response) {
  if(!shouldLoad()) {
    return
  }

	var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      log("hello");
      init()
    }
	}, 50);
});
