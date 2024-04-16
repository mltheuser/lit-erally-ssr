import Platform from './platform.js'
import { JSDOM } from './html-elements.js'

export default function css(strings, ...values) {
    const cssString = parseCssValues(strings, values);

    const validationResult = validateCSS(cssString);
    if (!validationResult.isValid) {
        throw new Error(`Invalid CSS code: ${validationResult.errorMessage}`);
    }

    return cssString;
}

const STYLE_RULE = 1;

function parseCssValues(strings, values) {
    let cssString = '';

    for (let i = 0; i < strings.length; i++) {
        cssString += strings[i];
        if (i < values.length) {
            cssString += values[i];
        }
    }
    return cssString;
}

function validateCSS(cssString) {

    const document = createEmptyDocument();

    const tempStyle = document.createElement('style');
    tempStyle.textContent = cssString;

    document.head.appendChild(tempStyle);

    const sheet = tempStyle.sheet;
    const rules = sheet.cssRules;
    let isValid = true;
    let errorMessage = '';

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];

        if (rule.type === STYLE_RULE) {
            const style = rule.style;

            for (let j = 0; j < style.length; j++) {
                const property = style[j];
                const value = style.getPropertyValue(property);

                if (!isValidCSSProperty(document, property)) {
                    isValid = false;
                    errorMessage = `Invalid property "${property}" in rule "${rule.selectorText}"`;
                    break;
                }

                if (!isValidCSSValue(document, property, value)) {
                    isValid = false;
                    errorMessage = `Invalid value "${value}" for property "${property}" in rule "${rule.selectorText}"`;
                    break;
                }
            }
        }

        if (!isValid) {
            break;
        }
    }

    document.head.removeChild(tempStyle);

    return {
        isValid,
        errorMessage,
    };
}

function createEmptyDocument() {
    let document;

    if (Platform.isClient()) {
        document = new DOMParser().parseFromString("", 'text/html');
    } else {
        document = new JSDOM("").window.document;
    }
    return document;
}

function isValidCSSProperty(document, property) {
    const tempElement = document.createElement('div');
    return property in tempElement.style;
}

function isValidCSSValue(document, property, value) {
    const tempElement = document.createElement('div');
    tempElement.style[property] = value;

    return tempElement.style[property] === value;
}