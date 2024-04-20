import { HTMLElement, customElements } from "./html-elements.js";
import JSONParser from './json-parser.js'

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

export default class WebComponent extends HTMLElement {

    #signalHandlers = {};
    #slot = '';

    constructor() {
        super();
        this.saveSlotContent();
        this.initializeState();
        this.initializeProperties();
    }

    connectedCallback() {
        this.requestRender()
    }

    saveSlotContent() {
        const slotElement = this.querySelector('slot');

        if (slotElement) {
            const slotContent = slotElement.innerHTML;
            this.#slot = slotContent.trim();
        } else {
            this.#slot = this.innerHTML;
        }

    }

    attributeChangedCallback(name, _, newValue) {
        this[name] = JSONParser.safeParse(newValue);
    }

    defineProperty(propName) {
        if (!Object.prototype.hasOwnProperty.call(this, propName)) {
            Object.defineProperty(this, propName, {
                get() {
                    return this[`#${propName}`];
                },
                set(value) {
                    const valueString = JSONParser.safeStringify(value)
                    if (valueString === JSONParser.safeStringify(this[`#${propName}`])) {
                        return
                    }
                    this[`#${propName}`] = value;
                    this.setAttribute(propName, valueString)
                    this.requestRender();
                },
            });
        }
    }

    defineState(stateName) {
        if (!Object.prototype.hasOwnProperty.call(this, stateName)) {
            Object.defineProperty(this, stateName, {
                get() {
                    return this[`#${stateName}`];
                },
                set(value) {
                    this[`#${stateName}`] = value;
                    this.requestRender();
                },
            });
        }
    }

    initializeProperties() {
        if (!this.constructor.properties) {
            return
        }

        for (const [propName, _] of Object.entries(this.constructor.properties)) {
            const attrValue = JSONParser.safeParse(this.getAttribute(propName));
            if (attrValue !== null) {
                this[`#${propName}`] = attrValue;
            }
            this.defineProperty(propName);
        }
    }

    initializeState() {
        if (!this.constructor.state) {
            return
        }
        for (const [stateName, stateValue] of Object.entries(this.constructor.state)) {
            if (!Object.prototype.hasOwnProperty.call(this, stateName)) {
                this[`#${stateName}`] = stateValue;
                this.defineState(stateName);
            }
        }
    }

    static get observedAttributes() {
        return Object.keys(this.properties);
    }

    signal(signalName, data) {
        let currentElement = this;

        while (currentElement) {
            if (currentElement instanceof WebComponent && currentElement.#signalHandlers && currentElement.#signalHandlers[signalName]) {
                currentElement.#signalHandlers[signalName].call(currentElement, data);
            }

            currentElement = currentElement.parentElement;
        }
    }

    registerSignalHandler(signalName, handler) {
        this.#signalHandlers[signalName] = handler
    }

    requestRender() {
        const htmlResult = this.render();
        const newDocument = htmlResult.document;

        this.insertChildrenIntoSlot(newDocument)
        this.appendPreprocessedStyleTag(newDocument);
        this.doMinimalUpdateToActiveDocument(newDocument);
        this.registerEventListeners(htmlResult);
    }


    registerEventListeners(htmlResult) {
        const eventListeners = htmlResult.eventListeners;
        for (let i = 0; i < eventListeners.length; ++i) {
            const target = this.querySelector(`[data-event-id="${i}"]`);
            const { eventName, fn } = eventListeners[i];

            // remove the "on" prefix from the event name
            const eventNameWithoutOn = eventName.slice(2);

            if (target.hasOwnProperty('##old' + eventName)) {
                // remove all existing event listeners for this event from target
                target.removeEventListener(eventNameWithoutOn, target['##old' + eventName]);
            }

            // register fn as handler for event
            target['##old' + eventName] = fn;
            target.addEventListener(eventNameWithoutOn, fn);

            // now remove the data-event-id="${i}" attribute
            target.removeAttribute("data-event-id")
        }
    }

    doMinimalUpdateToActiveDocument(newDocument) {
        let newHtmlPointer = newDocument.body; // Body Element (body tag)
        let oldHtmlPointer = this; // Custom Web Component Element (simple-button)

        // Get the tag name and attributes of oldHtmlPointer
        let oldTagName = oldHtmlPointer.tagName.toLowerCase();

        let newAttributes = Array.from(this.attributes)

        // Create a new element with the same tag name
        let newElement = newDocument.createElement(oldTagName);

        // Set the attributes of the new element to match those of oldHtmlPointer
        for (let i = 0; i < newAttributes.length; i++) {
            let attr = newAttributes[i];
            newElement.setAttribute(attr.name, attr.value);
        }

        // Append the contents of newHtmlPointer to the new element
        while (newHtmlPointer.firstChild) {
            newElement.appendChild(newHtmlPointer.firstChild);
        }

        // Replace newHtmlPointer with the new element
        newHtmlPointer.parentNode.replaceChild(newElement, newHtmlPointer);

        const comp = (oldPointer, newPointer) => {
            assert(oldPointer && newPointer)
            assert(oldPointer.nodeType === newPointer.nodeType)
            if (oldPointer.nodeType === 3) {
                oldPointer.textContent = newPointer.textContent
                return
            }
            if (oldPointer.nodeType !== 1) {
                oldPointer.outerHTML = newPointer.outerHTML
                return
            } else {
                if (oldPointer.outerHTML === newPointer.outerHTML) {
                    return
                }

                assert(oldPointer.tagName === newPointer.tagName)

                // Update attributes one by one on the element
                updateElementAttributes(newPointer, oldPointer);

                // Get the child elements of both pointers
                const oldChildren = Array.from(oldPointer.childNodes);
                const newChildren = Array.from(newPointer.childNodes);

                // check that both contain the exact same tags
                if (oldChildren.length !== newChildren.length) {
                    oldPointer.innerHTML = newPointer.innerHTML
                    return
                }
                let hasSameTags = true
                for (let i = 0; i < oldChildren.length; ++i) {
                    if (oldChildren[i].tagName !== newChildren[i].tagName && oldChildren[i].nodeType !== newChildren[i].nodeType) {
                        hasSameTags = false
                        break
                    }
                }
                if (!hasSameTags) {
                    oldPointer.innerHTML = newPointer.innerHTML
                    return
                }

                // Now if it has children we run the compare action on each of them if not we just replace the inner html
                for (let i = 0; i < oldChildren.length; i++) {
                    if (oldChildren[i].tagName && customElements.get(oldChildren[i].tagName.toLowerCase())) {
                        // Update attributes one by one on the element
                        updateElementAttributes(newChildren[i], oldChildren[i]);
                        continue
                    }
                    comp(oldChildren[i], newChildren[i])
                }
            }
        }

        comp(oldHtmlPointer, newElement);

    }

    appendPreprocessedStyleTag(newDocument) {
        const styleElement = newDocument.createElement('style');
        styleElement.textContent = this.preprocessStyles();
        newDocument.body.appendChild(styleElement);
    }

    preprocessStyles() {
        if (this.constructor['styles']) {
            const styles = this.constructor['styles'];
            const tagNames = this.getParentTagNames();
            const preprocessedStyles = styles.replace(/([^}{]+)({[^}]+})/g, (match, selector, rules) => {
                const preprocessedSelector = selector.trim().split(',').map(s => {
                    const parentSelectors = tagNames.map(tagName => `${tagName} `).join('');
                    return `${parentSelectors}${s.trim()}`;
                }).join(', ');
                return `${preprocessedSelector} ${rules}`;
            });
            return preprocessedStyles;
        }
    }

    getParentTagNames() {
        const tagNames = [this.tagName];
        let element = this;
        while (element.parentElement) {
            const tagName = element.parentElement.tagName.toLowerCase();
            tagNames.unshift(tagName);
            element = element.parentElement;
        }
        return tagNames;
    }

    insertChildrenIntoSlot(document) {
        const slot = document.querySelector('slot');
        if (slot && this.#slot) {
            slot.innerHTML = this.#slot;
        }
    }

    render() {
        return '';
    }
}

function updateElementAttributes(newPointer, oldPointer) {
    setNewAttributes(newPointer, oldPointer);
    removeOldAttributesThatAreNoLongerPresent(oldPointer, newPointer);
}
function removeOldAttributesThatAreNoLongerPresent(oldPointer, newPointer) {
    for (let i = 0; i < oldPointer.attributes.length; i++) {
        const oldAttr = oldPointer.attributes[i];
        if (!newPointer.hasAttribute(oldAttr.name)) {
            oldPointer.removeAttribute(oldAttr.name);
        }
    }
}

function setNewAttributes(newPointer, oldPointer) {
    for (let i = 0; i < newPointer.attributes.length; i++) {
        const newAttr = newPointer.attributes[i];
        if (!oldPointer.hasAttribute(newAttr.name) || oldPointer.getAttribute(newAttr.name) !== newAttr.value) {
            oldPointer.setAttribute(newAttr.name, newAttr.value);
        }
    }
}

