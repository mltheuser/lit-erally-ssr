import WebComponent from "../crossPlatform/web-component.js";
import { customElements } from "../crossPlatform/html-elements.js"

export default async function render(document) {
    const rootElement = document.documentElement;

    // Render custom elements recursively
    await renderCustomElementsRecursively(rootElement);

    return rootElement.innerHTML;
}

async function renderCustomElementsRecursively(element) {
    const tagName = element.tagName.toLowerCase();

    const customElementConstructor = customElements.get(tagName);
    if (customElementConstructor && customElementConstructor.prototype instanceof WebComponent) {
        element = await renderCustomElement(element, customElementConstructor);
    }

    const childElements = [...element.children];
    for (const child of childElements) {
        await renderCustomElementsRecursively(child);
    }
}

async function renderCustomElement(element, customElementConstructor) {
    const dynamicElementInstance = new customElementConstructor();

    dynamicElementInstance.innerHTML = element.innerHTML;

    dynamicElementInstance.saveSlotContent();

    const attributes = element.attributes;
    for (let j = 0; j < attributes.length; j++) {
        const attribute = attributes[j];
        dynamicElementInstance.setAttribute(attribute.name, attribute.value);
    }

    // Replace the old element with the new element
    element.parentNode.replaceChild(dynamicElementInstance, element);

    return dynamicElementInstance
}