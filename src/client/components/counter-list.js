import { css, customElements, WebComponent, html } from '../../webcomponent-lib/crossPlatform/index.js';

import './list-item.js'

function thisNot(value) {
    return true;
}

class CounterList extends WebComponent {

    static styles = css`p { color: red }`;

    static properties = {
        counts: thisNot,
    };

    static state = {
        counter: 0,
    }

    static getScriptUrl() {
        return "http://localhost:3000/src/client/components/counter-list.js";
    }

    handleClick() {
        this.counter++;
        this.signal("message", {text: "Hello from child"})
    }

    render() {
        return html`
              <ul>
                ${this.counts.map(c => html`<li><list-item>A + ${c}</list-item></li>`)}
              </ul>
              <p>Thats all folks</p>
              <p>${this.counter}</p>
              <button onclick=${this.handleClick.bind(this)}>This will change text on parent</button>
          `;
    }

}

customElements.define("counter-list", CounterList);