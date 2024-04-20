import WebComponent from "../crossPlatform/web-component.js";
import { customElements } from "../crossPlatform/html-elements.js";

export default function hydrate(htmlResult) {
    const { document } = htmlResult;

    // Extract unique tag names from the parsed HTML
    const tagNames = extractTagNames(document);

    // Collect script URLs from custom elements
    const scriptUrls = getScriptUrlsFromCustomElements(tagNames);

    // Add script tags for each unique script URL
    addScriptTags(scriptUrls, document);

    return document;
}

function extractTagNames(document) {
    // Gather unique tag names from the parsed HTML
    const tagNames = new Set();
    const elements = document.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        tagNames.add(elements[i].tagName.toLowerCase());
    }
    return tagNames;
}

function getScriptUrlsFromCustomElements(tagNames) {
    // Create a Set to store the script URLs
    const scriptUrls = new Set();

    tagNames.forEach(tagName => {
        const customElementConstructor = customElements.get(tagName);
        if (customElementConstructor && customElementConstructor.prototype instanceof WebComponent) {
            scriptUrls.add(customElementConstructor.getScriptUrl());
        }
    });

    return scriptUrls;
}

function addScriptTags(scriptUrls, document) {
    // Add script tags for each unique script URL
    scriptUrls.forEach(scriptUrl => {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `
        (function() {
            var scriptUrl = '${scriptUrl}';
            var existingScript = document.querySelector('script[src="' + scriptUrl + '"]');
            if (!existingScript) {
                var newScript = document.createElement('script');
                newScript.type = 'module';
                newScript.src = scriptUrl;
                document.head.appendChild(newScript);
            }
            document.currentScript.remove();
        })();
    `;
        document.head.appendChild(scriptElement);
    });
}