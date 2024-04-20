import { css, customElements, WebComponent, html } from '../../webcomponent-lib/crossPlatform/index.js';

class ListItem extends WebComponent {

    static properties = {

    };

    static state = {
        checked: false
    }

    static getScriptUrl() {
        return "http://localhost:3000/src/client/components/list-item.js";
    }

    handleButtonClick() {
        this.checked = true
    }

    render() {
        return html`
            <div>
                <slot></slot>
                <p>YOHO</p>
                <button onclick=${this.handleButtonClick.bind(this)}>Check me</button>
                ${this.checked ? 'Yo' : 'No'}
            </div>
          `;
    }

}

customElements.define("list-item", ListItem);