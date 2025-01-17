chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTranscript") {
      const xpath = '//*[@id="ct-sidebar-scroll-container"]/div';
      let element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element) {
        sendResponse({transcript: element.innerText});
      } else {
        sendResponse({transcript: 'Transcript not found.'});
      }
    }
    return true;
  });

function toggleTranscript() {
    const transcriptToggle = document.evaluate(
        "//*[@data-purpose='transcript-toggle']",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    if (transcriptToggle && transcriptToggle.getAttribute('aria-expanded') === 'false') {
        transcriptToggle.click();
    }
}

function clickCourseContent() {
    const courseContentButton = document.evaluate(
        "//button[.//span[contains(text(),'Course content')]]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    if (courseContentButton) {
        courseContentButton.click();
    }
}

function displayNotes() {
    chrome.storage.local.get([window.location.href], function (result) {
        if (result[window.location.href]) {
            let notesArray = result[window.location.href];
            // Send message to popup to update notes
            chrome.runtime.sendMessage({
                action: 'displayNotes',
                notes: notesArray[notesArray.length - 1]
            });
        }
    });
}

function init() {
    setTimeout(() => {
      console.log("Trying to show transcript and course content")
        toggleTranscript();
        clickCourseContent();
        displayNotes();
    }, 3000); // Delay to allow page content to load
}

// Initialize on page load
window.addEventListener('load', init);

// Monitor URL changes using MutationObserver
let lastHref = window.location.href;

const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
        if (lastHref !== window.location.href) {
            lastHref = window.location.href;
            init();
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// Handle pushState and popstate events
(function(history) {
    const pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({ state: state });
        }
        const result = pushState.apply(history, arguments);
        window.dispatchEvent(new Event("pushstate"));
        window.dispatchEvent(new Event("locationchange"));
        return result;
    };

    window.addEventListener("popstate", () => {
        window.dispatchEvent(new Event("locationchange"));
    });
})(window.history);

window.addEventListener("locationchange", () => {
    init();
});