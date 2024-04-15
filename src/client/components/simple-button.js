import { css, customElements, WebComponent, html } from '../../webcomponent-lib/crossPlatform/index.js';

import './counter-list.js'

class SimpleButton extends WebComponent {

    static styles = css`p{ color: blue }`;

    static properties = {
        text: String,
    };

    static state = {
        clickCounter: 0,
        dynamicText: "can change"
    };

    static getScriptUrl() {
        return "src/client/components/simple-button.js";
    }

    constructor() {
        super()
        this.registerSignalHandler("message", (data) => { console.log(data); this.dynamicText = data.text })
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
              <p>${html`<div onclick=${() => console.log("That was clicked")}>Hello World</div>`}</p>
              <counter-list counts=${counts}></counter-list>
          `;
    }

}

customElements.define("simple-button", SimpleButton);