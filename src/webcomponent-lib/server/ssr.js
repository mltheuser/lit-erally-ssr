import WebComponent from "../crossPlatform/web-component.js";
import { customElements } from "../crossPlatform/html-elements.js"

export default function render(document) {
    // Gather unique tag names from the parsed HTML
    const elements = [...document.documentElement.children];
    for (let i = 0; i < elements.length; i++) {
        const tagName = elements[i].tagName.toLowerCase();

        const customElementConstructor = customElements.get(tagName);
        if (tagName === 'list-item') {
            console.log('awdaw')
            console.log(document.documentElement.outerHTML)
        }
        if (customElementConstructor && customElementConstructor.prototype instanceof WebComponent) {
            console.log(`Valid custom element: ${tagName}`);

            const dynamicElementInstance = new customElementConstructor();

            dynamicElementInstance.innerHTML = elements[i].innerHTML;

            dynamicElementInstance.saveSlotContent();

            const attributes = elements[i].attributes;
            for (let j = 0; j < attributes.length; j++) {
                const attribute = attributes[j];
                dynamicElementInstance.setAttribute(attribute.name, attribute.value);
            }

            // Assign the new element to the parent node
            elements[i].parentNode.insertBefore(dynamicElementInstance, elements[i].nextSibling);

            // Remove the old element from the DOM tree
            elements[i].remove();

            elements.push(...dynamicElementInstance.children)
        } else {
            elements.push(...elements[i].children)
        }
    }

    return document.documentElement.innerHTML;
}