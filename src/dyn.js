// dyn.js
import { css } from 'lit'

function isClient() {
    return typeof window !== 'undefined' && window.HTMLElement && window.customElements
}

let HTMLElement, customElements;
let JSDOM;

if (isClient()) {
    HTMLElement = window.HTMLElement;
    customElements = window.customElements;
} else {
    const jsDomImport = await import('jsdom');

    JSDOM = jsDomImport.JSDOM;

    const dom = new JSDOM();
    const window = dom.window;

    HTMLElement = window.HTMLElement;
    customElements = window.customElements;
}

function safeJSONParse(value) {
    try {
        return JSON.parse(value)
    } catch {
        return value
    }
}

class DynamicElement extends HTMLElement {

    _signalHandlers = {}

    constructor() {
        super();
        this._slot = this.extractSlotContent();
        this.initializeState();
        this.initializeProperties();
    }

    extractSlotContent() {
        const slotStartComment = '<slot>';
        const slotEndComment = '</slot>';
        const innerHTML = this.innerHTML;
        const startIndex = innerHTML.indexOf(slotStartComment);
        const endIndex = innerHTML.indexOf(slotEndComment);

        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            const slotContent = innerHTML.slice(startIndex + slotStartComment.length, endIndex);
            return slotContent.trim();
        } else {
            return this.innerHTML;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = safeJSONParse(newValue);
    }

    initializeProperties() {
        if (!this.constructor.properties) {
            return
        }

        for (const [propName, propType] of Object.entries(this.constructor.properties)) {
            const attrValue = safeJSONParse(this.getAttribute(propName));
            if (attrValue !== null) {
                this[`_${propName}`] = attrValue;
            }
            if (!Object.prototype.hasOwnProperty.call(this, propName)) {
                Object.defineProperty(this, propName, {
                    get() {
                        return this[`_${propName}`];
                    },
                    set(value) {
                        this[`_${propName}`] = value;
                        this.requestRender();
                    },
                });
            }
        }
    }

    static get observedAttributes() {
        return Object.keys(this.properties);
    }

    initializeState() {
        if (!this.constructor.state) {
            return
        }
        for (const [stateName, stateValue] of Object.entries(this.constructor.state)) {
            if (!Object.prototype.hasOwnProperty.call(this, stateName)) {
                this[`_${stateName}`] = stateValue;
                Object.defineProperty(this, stateName, {
                    get() {
                        return this[`_${stateName}`];
                    },
                    set(value) {
                        this[`_${stateName}`] = value;
                        this.requestRender();
                    },
                });
            }
        }
    }

    signal(signalName, data) {
        let currentElement = this;

        while (currentElement) {
            if (currentElement instanceof DynamicElement && currentElement._signalHandlers && currentElement._signalHandlers[signalName]) {
                currentElement._signalHandlers[signalName].call(currentElement, data);
            }

            currentElement = currentElement.parentElement;
        }
    }

    registerSignalHandler(signalName, handler) {
        this._signalHandlers[signalName] = handler
    }

    requestRender() {
        const htmlResult = this.render();
        const newDocument = htmlResult.document;

        this.insertChildrenIntoSlot(newDocument)

        // append style tag with ${this.preprocessStyles()} inside.
        const styleElement = newDocument.createElement('style');
        styleElement.textContent = this.preprocessStyles();
        newDocument.body.appendChild(styleElement);

        let newHtmlPointer = newDocument.body;
        let oldHtmlPointer = this

        const comp = (oldPointer, newPointer) => {
            // Get the child elements of both pointers
            const oldChildren = oldPointer.children;
            const newChildren = newPointer.children;

            // Iterate over the child elements
            for (let i = 0; i < Math.max(oldChildren.length, newChildren.length); i++) {
                const oldChild = oldChildren[i];
                const newChild = newChildren[i];

                // Check if both have the same tag
                if (oldChild && newChild && oldChild.tagName === newChild.tagName) {
                    if (oldChild.outerHTML !== newChild.outerHTML) {
                        // If outerHTML differs:
                        // Check if only the tag and attributes are the same and only the innerHTML differs.
                        if (oldChild.tagName === newChild.tagName && oldChild.attributes.length === newChild.attributes.length) {
                            let sameAttributes = true;
                            for (let i = 0; i < oldChild.attributes.length; i++) {
                                const oldAttr = oldChild.attributes[i];
                                const newAttr = newChild.attributes[i];
                                if (oldAttr.name !== newAttr.name || oldAttr.value !== newAttr.value) {
                                    sameAttributes = false;
                                    break;
                                }
                            }

                            if (sameAttributes) {
                                // Check if the element is a custom web component
                                if (customElements.get(oldChild.tagName.toLowerCase())) {
                                    // If it is a custom element, leave the old element alone
                                    return;
                                } else {
                                    // If it is not a custom element, check if it has children
                                    if (oldChild.children.length === 0) {
                                        // If the element doesn't have children, replace its innerHTML
                                        oldChild.innerHTML = newChild.innerHTML;
                                    } else {
                                        // If the element has children, go one level lower for the comparison
                                        comp(oldChild, newChild);
                                    }
                                }
                            } else {
                                // If the attributes are different:
                                oldChild.innerHTML = newChild.innerHTML

                                // Update attributes one by one on the element
                                for (let i = 0; i < newChild.attributes.length; i++) {
                                    const newAttr = newChild.attributes[i];
                                    oldChild.setAttribute(newAttr.name, newAttr.value);
                                }
                                // Remove any attributes that are not present in the new element
                                for (let i = 0; i < oldChild.attributes.length; i++) {
                                    const oldAttr = oldChild.attributes[i];
                                    if (!newChild.hasAttribute(oldAttr.name)) {
                                        oldChild.removeAttribute(oldAttr.name);
                                    }
                                }
                            }
                        } else {
                            // If the tag names are different, replace the element with the new one
                            oldChild.parentNode.replaceChild(newChild.cloneNode(true), oldChild);
                        }
                    }
                } else if (newChild) {
                    // New element was added, insert it at the current position
                    if (oldChild) {
                        oldChild.parentNode.insertBefore(newChild.cloneNode(true), oldChild);
                    } else {
                        oldPointer.appendChild(newChild.cloneNode(true));
                    }
                } else if (oldChild) {
                    // Old element needs to be removed
                    oldChild.parentNode.removeChild(oldChild);
                    i--; // Adjust the index since an element was removed
                }
            }
        };

        comp(oldHtmlPointer, newHtmlPointer);

        const eventListeners = htmlResult.eventListeners // each list item has form: { eventName: string, fn: Function }
        for (let i = 0; i < eventListeners.length; ++i) {
            console.log(this.innerHTML)
            const target = this.querySelector(`[data-event-id="${i}"]`);
            const { eventName, fn } = eventListeners[i];

            // remove the "on" prefix from the event name
            const eventNameWithoutOn = eventName.slice(2);

            if (target.hasOwnProperty('__old' + eventName)) {
                // remove all existing event listeners for this event from target
                target.removeEventListener(eventNameWithoutOn, target['__old' + eventName]);
            }

            // register fn as handler for event
            target['__old' + eventName] = fn;
            target.addEventListener(eventNameWithoutOn, fn);
        }
    }


    preprocessStyles() {
        if (this.constructor['styles']) {
            const styles = this.constructor['styles'].cssText;
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
        // Find the slot element
        const slot = document.querySelector('slot');
        if (slot && this._slot) {
            // Set the slot's innerHTML to the desired content
            slot.innerHTML = this._slot;
        }
    }

    render() {
        return '';
    }
}

function html(strings, ...values) {
    const attributeRegex = /=$/;
    const eventListeners = [];

    let htmlString = strings.reduce((result, string, i) => {
        let value = values[i];

        if (value === undefined) {
            return result + string;
        }

        if (attributeRegex.test(string.trim())) {
            if (typeof value === 'function') {
                const eventAttrIndex = string.lastIndexOf(' ');
                const eventAttr = string.substr(eventAttrIndex).trim();
                const eventName = eventAttr.slice(0, -1).toLowerCase();
                eventListeners.push({ eventName, fn: value });
                return result + string.slice(0, eventAttrIndex) + ` data-event-id="${eventListeners.length - 1}"`;
            } else {
                value = JSON.stringify(value);
            }
        } else if (Array.isArray(value)) {
            value = value.map(item => String(item)).join('');
        } else {
            value = String(value);
        }

        return result + string + value;
    }, '');

    let temporaryDocument;

    if (!isClient()) {
        // Running on Node.js
        const dom = new JSDOM(htmlString);
        temporaryDocument = dom.window.document;

        // Check if the parsed HTML is valid
        if (temporaryDocument.body.innerHTML === '') {
            throw new Error('Invalid HTML string');
        }
    } else {
        // Running in the browser
        const parser = new DOMParser();
        temporaryDocument = parser.parseFromString(htmlString, 'text/html');

        // Check if the parsed HTML is valid
        if (temporaryDocument.body.innerHTML === '') {
            throw new Error('Invalid HTML string');
        }
    }

    const testHtml = temporaryDocument.body.innerHTML

    return {
        document: temporaryDocument,
        eventListeners: eventListeners,
    }
}

export { DynamicElement, customElements, html, css };