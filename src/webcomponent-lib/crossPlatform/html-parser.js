import Platform from './platform.js'
import { JSDOM } from './html-elements.js'

export default function html(strings, ...values) {

    var { htmlStringWithParsedValues, eventListeners } = parseValues(strings, values);
    const temporaryDocument = parseAsDocument(htmlStringWithParsedValues);

    return {
        document: temporaryDocument,
        eventListeners: eventListeners,
    }
}

function isAttribute(value) {
    const attributeRegex = /=$/;
    return attributeRegex.test(value.trim())
}

function extractEventName(htmlString) {
    const eventAttrIndex = htmlString.lastIndexOf(' ');
    const eventAttr = htmlString.substr(eventAttrIndex).trim();
    const eventName = eventAttr.slice(0, -1).toLowerCase();
    return { eventName, eventAttrIndex };
}

function isFunction(value) {
    return typeof value === 'function';
}

function parseValues(strings, values) {
    const eventListeners = [];

    let htmlStringWithParsedValues = strings.reduce((result, htmlString, i) => {
        let value = values[i];

        if (value === undefined) {
            return result + htmlString;
        }

        if (isAttribute(htmlString)) {
            if (isFunction(value)) {
                const { eventName, eventAttrIndex } = extractEventName(htmlString);
                eventListeners.push({ eventName, fn: value });
                return result + htmlString.slice(0, eventAttrIndex) + ` data-event-id="${eventListeners.length - 1}"`;
            } else {
                value = JSON.stringify(value);
            }
        } else if (Array.isArray(value)) {
            value = value.map(item => String(item)).join('');
        } else {
            value = String(value);
        }

        return result + htmlString + value;
    }, '');
    return { htmlStringWithParsedValues, eventListeners };
}

function parseAsDocument(htmlString) {
    let document;

    if (Platform.isClient()) {
        document = new DOMParser().parseFromString(htmlString, 'text/html');
    } else {
        document = new JSDOM(htmlString).window.document;
    }

    if (document.body.innerHTML === '') {
        throw new Error('Invalid HTML string');
    }

    return document;
}
