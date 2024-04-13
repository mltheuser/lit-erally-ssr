import Platform from './platform.js'

let HTMLElement, customElements;
let JSDOM;

if (Platform.isClient()) {
    HTMLElement = window.HTMLElement;
    customElements = window.customElements;
} else {
    const jsDomImport = await import('jsdom');

    JSDOM = jsDomImport.JSDOM;

    const dom = new JSDOM();
    const window = dom.window;

    HTMLElement = window.HTMLElement;
    customElements = window.customElements;
}

export { HTMLElement, customElements, JSDOM }