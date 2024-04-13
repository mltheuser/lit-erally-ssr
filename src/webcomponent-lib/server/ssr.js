export default function render(document) {
    // Gather unique tag names from the parsed HTML
    const elements = document.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        const tagName = elements[i].tagName.toLowerCase();

        const customElementConstructor = customElements.get(tagName);
        if (customElementConstructor && customElementConstructor.prototype instanceof DynamicElement) {
            console.log(`Valid custom element: ${tagName}`);

            const dynamicElementInstance = new customElementConstructor();

            dynamicElementInstance._slot = elements[i].innerHTML;

            const attributes = elements[i].attributes;
            for (let j = 0; j < attributes.length; j++) {
                const attribute = attributes[j];
                dynamicElementInstance.setAttribute(attribute.name, attribute.value);
            }

            // Assign the new element to the parent node
            elements[i].parentNode.insertBefore(dynamicElementInstance, elements[i].nextSibling);

            // Remove the old element from the DOM tree
            elements[i].remove();

            dynamicElementInstance.requestRender();
        }
    }

    return document.documentElement.innerHTML;
}