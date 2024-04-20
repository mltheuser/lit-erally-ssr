## Lit-erally SSR

Server Side Rendered WebComponents with lit-like client side state managment and htmx-like client side element replacment.

> This is just an experiment and not indeded for use in an actual project.

### How it works

```js
import { css, customElements, WebComponent, html, replace } from 'it-erally-ssr';

class SimpleButton extends WebComponent {

    // You can set component styles through the styles variable.
    // The css function can help you parse and check your css for errors.
    static styles = css`p{ color: blue }`;

    // A...
    static attributes = {
        prompt: String,
    };

    static state = {
        clickCounter: 0,
    };

    static getScriptUrl() {
        return "${serverDomain}/components/simple-button.js";
    }

    handleClick() {
        this.clickCounter++;
    }

    render() {
        return html`
              <button onclick=${this.handleClick}>${prompt}</button>
              <p>You clicked: ${this.clickCounter} times</p>
          `;
    }

}

customElements.define("simple-button", SimpleButton);
```
