## Lit-erally SSR

Server Side Rendered WebComponents with lit-like client side state managment and htmx-like client side element replacement.

> This is just an experiment and not intended for use in an actual project.

### How it works

Here is a simple example for a custom WebComponent. It creates a button and a counter for the amount of times the button was clicked.

```js
import { css, customElements, WebComponent, html, replace } from 'it-erally-ssr';

class SimpleButton extends WebComponent {

    static styles = css`p{ color: blue }`;

    static properties = {
        prompt: isString,
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
    prompt: isString,
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
        listOfCountries: isListOfStrings,
    };
    render() {
        return html`<ul>
            ${this.listOfCountries.map(countryCode => html`<li>${countryCode}</li>`)}
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

"isListOfStrings" or "isString" in these examples are validator functions. They have the signature (value: any) => bool and are run on every value that you try to pass to the validated property. If such a test fails an Error is thrown.

#### Signals

To pass data up the element chain you use signals.

```js
handleClick() {
    this.signal("messageSignal", {text: "Hello from child"})
}
```

This will be passed up the element chain until the document root is reached. To handle a signal in a parent you register a signal handler using the same signal name.

```js
constructor() {
    super()
    this.registerSignalHandler("messageSignal", (data) => { this.dynamicText = data.text })
}
```

#### Styles

This version of WebComponents does not use shadow roots. Instead everything lives in the same DOM. To still enable custom styling for a component the rules are overspecified.

```js
p { color: blue };

// The rule above will be transformed into:

html body [... all parent tags] simple-button p { color: blue };
```

To set the styling use the static styles variable for locality or some global css style sheet.

```js
static styles = css`p{ color: blue }`;
```

#### SSR

```js
router.get('/', async (ctx) => {

    const htmlObject = html`
        <p>text</p>
        <div>
            <simple-button></simple-button>
        </div>
    `
    const htmlString = render(hydrate(htmlObject));

    ctx.type = 'text/html';
    ctx.body = htmlRender;
});
```

To render html with custom components on the server you need the html, hydrate and render functions. Here is a quick breakdown of what each of them does:

- *html* - Checks that the html string is valid by parsing them to a document and takes note of eventlisteners that need to be created.
- *hydrate* - Adds Script Injections for all Custom Components used. These injections will run once when the client recives the html to make sure all needed scripts are present in the document header.
- *render* - Expands all custom components by rendering them in their initial state.

#### Slot

To keep it simple these WebComponents don't support named slots. There is one slot for all child elements.

```js
class CountryBoard extends WebComponent {
    render() {
        return html`<slot></slot>`
    }
}

class App extends WebComponent {
    render() {
        return html`<country-board>
            <p>Noting to show!</p>
        </country-board>`
    }
}
```

#### xReplace

I added some helper function to make it easier to add/replace html using the server.

```js
xReplace(selectorString or HTMLElement, String or Promise<String>)
```

Here is a usage example

```js
xReplace("#replaceButton", fetch('/buttonClicked').then(response => response.text()))
```

There are also xAppend(target, source) and xPrepend(target, source) for adding the new html before or after the target.

#### Script URL

For the server side hydration to work we need to be able to find out where to request a components script from. I finally decided that the best tradeoff between simplicity and coupling is achived by providing this url for each WebComponent through it's getScriptUrl() method. This leaves the user a lot of options for abstraction when setting up their framework.

```js
static getScriptUrl() {
    return "${serverDomain}/components/simple-button.js";
}
```

#### Rerender

The update process is also as simple stupid as possible. When a new render comes in the html is compared to the old html. If two elements have different tags or are text/comment nodes they are replaced completely. If not the children are checked. If the child elements are still the same number, order and tag wise the parent element remains untouched and the children are now compared one by one. Custom Elements only have their attributes updated (if they are not replaced entierly with all the other children of their parent), their rerender will do the rest. This is done so their state is not reset needlessly.

### Try it out

This project also comes with a basic setup that can be used to create web apps. Clone the project. Then run 

```bash
npm install
npm run start
```

Now feel free to experiment a bit with the example.
