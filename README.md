## Lit-erally SSR

Server Side Rendered WebComponents with lit-like client side state managment and htmx-like client side element replacment.

> This is just an experiment and not indeded for use in an actual project.

### How it works

Here is a simple example for a custom WebComponent. It creates a button and a counter for the amount of times the button was clicked.

```js
import { css, customElements, WebComponent, html, replace } from 'it-erally-ssr';

class SimpleButton extends WebComponent {

    static styles = css`p{ color: blue }`;

    static properties = {
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

#### State

```js
static state = {
    clickCounter: 0,
};
```

To register state on your Component add it's name and inital value to the static state dictonary. This will create an internal variable #clickCounter to store the value and build getter and setter methods for clickCounter to access and modify the state. Each time the setter is called the component will request a rerender.

```js
handleClick() {
    this.clickCounter++; // <-- Will trigger a rerender.
}
```

#### Properties

```js
static properties = {
    prompt: String,
};
```

Properties are state variables that can be set through an attribute with the same name and are reflected in the same attribute. This means that calling setAttribute() on a WebComponent will trigger the properties setter and therefore a rerender. In addition to that the setter now also makes sure that the attributes value in the dom is kept up to date when the property is directly set.

```js
handleClick() {
    this.prompt = "Please Click Again"; // <-- A property can be set just like a state variable.
}
```

This is only possible because properties are restricted to be strings, numbers or JSON serializable objects (arrays, dicts). Most of the serialization and deserialization happens behind the scene. You can either provide the attribute with a stringified object directly or let the component try to handel it. Here is an example of how you can pass a list from one component to it's child.

```js
class CountryBoard extends WebComponent {
    static properties = {
        listOfCountries: Array, // <-- The type is not used right now, I might remove it.
    };
    render() {
        return html`<ul>
            ${this.listOfCountries.map(countryCode => html`<li>countryCode</li>`)}
        </ul>`
    }
}

class App extends WebComponent {
    render() {
        const listOfCountries = ["USA", "NL"]
        return html`<country-board listOfCountries=${listOfCountries}>`
    }
}
```
