// SimpleButton.js
import { customElements, DynamicElement } from './dyn.js';

function safeJSONParse(value) {
    try {
        return JSON.parse(value)
    } catch {
        return value
    }
}

const slotStartComment = '<!--slot start-->';
const slotEndComment = '<!--slot end-->';

class SimpleButton extends DynamicElement {

    _slot = '';

    // property
    #text;

    // state
    #clickCounter = 0;

    static styles = css`p { color: blue }`;

    static get observedAttributes() {
        return ['text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = safeJSONParse(newValue);
    }

    constructor() {
        super();

        this._slot = (() => {
            const innerHTML = this.innerHTML;
            const startIndex = innerHTML.indexOf(slotStartComment);
            const endIndex = innerHTML.indexOf(slotEndComment);

            if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                const slotContent = innerHTML.slice(startIndex + slotStartComment.length, endIndex);
                return slotContent.trim();
            } else {
                return this.innerHTML;
            }
        })();

        this.#text = safeJSONParse(this.getAttribute('text'))
    }

    set clickCounter(value) {
        console.log(value)
        this.#clickCounter = value;
        this.requestRender();
    }

    get clickCounter() {
        return this.#clickCounter;
    }

    set text(value) {
        console.log(value)
        this.#text = value;
        this.requestRender();
    }

    get text() {
        return this.#text;;
    }

    static getScriptUrl() {
        return "src/SimpleButton.js";
    }

    handleClick() {
        console.log("Clicked");
        this.clickCounter++;
    }

    requestRender() {
        // replace the slot with the._slot
        this.innerHTML = this.render();

        // Move the slot content into the shadow DOM
        const slotElement = this.querySelector('slot');
        if (slotElement) {
            slotElement.outerHTML = slotStartComment + this._slot + slotEndComment;
        }

        // Add the styleing to the component
        // Make sure it only affects this component and it's children. But do it without using shadowRoot
        const styleElement = document.createElement('style');
        styleElement.textContent = SimpleButton.styles.cssText;
        this.appendChild(styleElement);

        // temporary location for event listeners
        this.querySelector('button').addEventListener('click', this.handleClick.bind(this));
    }

    render() {
        return `
              <button>Click Me</button>
              <p>${this.text}: ${this.clickCounter} times</p>
              <slot></slot>
              ${this.text.map(x => "A" + x)}
          `;
    }

}

// Register the SimpleButton custom element
customElements.define("simple-button", SimpleButton);