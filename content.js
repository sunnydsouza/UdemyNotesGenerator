// content.js
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
    return true; // Required to indicate async sendResponse
  });
  
