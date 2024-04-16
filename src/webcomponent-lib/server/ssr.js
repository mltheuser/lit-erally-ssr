import WebComponent from "../crossPlatform/web-component.js";
import { customElements } from "../crossPlatform/html-elements.js"

export default function render(document) {
    const rootElement = document.documentElement;

    // Extract child elements and their children recursively
    const elements = extractChildElementsRecursively(rootElement);

    // Render custom elements and replace them with dynamic versions
    elements.forEach(element => {
        const tagName = element.tagName.toLowerCase();

        const customElementConstructor = customElements.get(tagName);
        if (customElementConstructor && customElementConstructor.prototype instanceof WebComponent) {
            renderCustomElement(element, customElementConstructor);
        }
    });

    return rootElement.innerHTML;
}

function extractChildElementsRecursively(element) {
    const elements = [...element.children];
    elements.forEach(child => {
        elements.push(...extractChildElementsRecursively(child));
    });
    return elements;
}

function renderCustomElement(element, customElementConstructor) {
    const dynamicElementInstance = new customElementConstructor();

    dynamicElementInstance.innerHTML = element.innerHTML;

    dynamicElementInstance.saveSlotContent();

    const attributes = element.attributes;
    for (let j = 0; j < attributes.length; j++) {
        const attribute = attributes[j];
        dynamicElementInstance.setAttribute(attribute.name, attribute.value);
    }

    // Assign the new element to the parent node
    element.parentNode.insertBefore(dynamicElementInstance, element.nextSibling);

    // Remove the old element from the DOM tree
    element.remove();
}