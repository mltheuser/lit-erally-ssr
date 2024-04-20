import { css, customElements, WebComponent, html, replace } from '../../webcomponent-lib/crossPlatform/index.js';

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
        return "http://localhost:3000/src/client/components/simple-button.js";
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
              <button id="replaceButton" onclick=${() => {
                console.log("try replacing")
                replace("#replaceButton", fetch('/buttonClicked').then(response => response.text()))
              }}>This will replace the element</button>
          `;
    }

}

customElements.define("simple-button", SimpleButton);