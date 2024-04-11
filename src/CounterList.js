// CounterList.js
import { customElements, DynamicElement, html, css } from './dyn.js';

class CounterList extends DynamicElement {

    static styles = css`p { color: red }`;

    // property
    static properties = {
        counts: String,
    };

    static state = {
        counter: 0,
    }

    static getScriptUrl() {
        return "src/CounterList.js";
    }

    handleClick() {
        console.log("Clicked");
        this.counter++;
        this.signal("message", {text: "Hello from child"})
    }

    render() {
        return html`
              <ul>
                ${(this.counts.map(c => `<li>A + ${c}</li>`)).join('')}
              </ul>
              <p>Thats all folks</p>
              <p>${this.counter}</p>
              <button onclick=${this.handleClick.bind(this)}>This will change text on parent</button>
          `;
    }

}

customElements.define("counter-list", CounterList);