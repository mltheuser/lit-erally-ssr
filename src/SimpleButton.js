// SimpleButton.js
import { css, customElements, DynamicElement, html } from './dyn.js';

import './CounterList.js'

class SimpleButton extends DynamicElement {

    static styles = css`p{ color: blue }`;

    // property
    static properties = {
        text: String,
    };

    // state
    static state = {
        clickCounter: 0,
        dynamicText: "can change"
    };

    constructor() {
        super()
        this.registerSignalHandler("message", (data) => { console.log(data); this.dynamicText = data.text })
    }

    static getScriptUrl() {
        return "src/SimpleButton.js";
    }

    handleClick() {
        console.log("Clicked");
        this.clickCounter++;
    }

    render() {
        const counts = []
        for (let i = 0; i < this.clickCounter; i++) {
            counts.push(i)
        }
        return html`
              <button onclick=${this.handleClick.bind(this)}>Click Me</button>
              <p>${this.text}: ${this.clickCounter} times</p>
              <p>${this.dynamicText}</p>
              <slot></slot>
              <counter-list counts=${counts}></counter-list>
          `;
    }

}

// Register the SimpleButton custom element
customElements.define("simple-button", SimpleButton);