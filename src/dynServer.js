// dynServer.js

import { customElements, DynamicElement } from './dyn.js';

function hydrate(htmlResult) {
    // Create a JSDOM instance with the HTML string
    const { document } = htmlResult;

    // Gather unique tag names from the parsed HTML
    const tagNames = new Set();
    const elements = document.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        tagNames.add(elements[i].tagName.toLowerCase());
    }

    // Create a Set to store the script URLs
    const scriptUrls = new Set();

    tagNames.forEach(tagName => {
        const customElementConstructor = customElements.get(tagName);
        if (customElementConstructor && customElementConstructor.prototype instanceof DynamicElement) {
            console.log(`Valid custom element: ${tagName}`);
            console.log(customElementConstructor);
            scriptUrls.add(customElementConstructor.getScriptUrl());
        }
    });

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

    return document;
}

function render(document) {
    // Gather unique tag names from the parsed HTML
    const elements = document.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        const tagName = elements[i].tagName.toLowerCase();

        const customElementConstructor = customElements.get(tagName);
        if (customElementConstructor && customElementConstructor.prototype instanceof DynamicElement) {
            console.log(`Valid custom element: ${tagName}`);

            const dynamicElementInstance = new customElementConstructor();

            const attributes = elements[i].attributes;
            for (let j = 0; j < attributes.length; j++) {
                const attribute = attributes[j];
                dynamicElementInstance.setAttribute(attribute.name, attribute.value);
            }

            dynamicElementInstance._slot = elements[i].innerHTML;

            dynamicElementInstance.requestRender();

            // Assign the new element to the parent node
            elements[i].parentNode.insertBefore(dynamicElementInstance, elements[i].nextSibling);

            // Remove the old element from the DOM tree
            elements[i].remove();

            dynamicElementInstance.requestRender();
        }
    }

    return document.documentElement.innerHTML;
}

export { hydrate, render }