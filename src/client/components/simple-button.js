import { css, customElements, WebComponent, html, xReplace, xAppend } from '../../webcomponent-lib/crossPlatform/index.js';

import './counter-list.js'

function isString(value) {
    return true
}

class SimpleButton extends WebComponent {

    static styles = css`p{ color: blue }`;

    static properties = {
        text: isString,
    };

    static state = {
        clickCounter: 0,
        dynamicText: "can change"
    };

    static getScriptUrl() {
        return "http://localhost:3000/src/client/components/simple-button.js";
    }

    constructor() {
        super()
        this.registerSignalHandler("message", (data) => { console.log(data); this.dynamicText = data.text })
    }

    handleClick() {
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
              <p>${html`<div onclick=${() => console.log("That was clicked")}>Hello World</div>`}</p>
              <counter-list counts=${counts}></counter-list>
              <button id="replaceButton" onclick=${() => {
                this.text = "something else"
                xReplace("#replaceButton", fetch('/buttonClicked').then(response => response.text()))
              }}>This will replace the element</button>
          `;
    }

}

customElements.define("simple-button", SimpleButton);