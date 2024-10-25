// ==UserScript==
// @name         Udemy Course Automations
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automate toggling transcript and opening course content on Udemy course pages.
// @author       Sunny Dsouza
// @match        https://*.udemy.com/course/*/learn/lecture/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to toggle transcript if aria-expanded is false
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

    // Function to find and click the 'Course content' button
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

    // Run the functions after the page loads
    window.onload = function() {
        setTimeout(() => {
            toggleTranscript();
            clickCourseContent();
        }, 6000); // Adjust the delay if necessary
    };

})();
