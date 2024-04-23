/*
/ - target can be either a HTMLElement or a selector string.
/ - source can be either a string or a promise resolving to a string.
*/
function replaceContent(target, source) {
    // Assert that the resolved value is a string
    console.assert(
        typeof source === 'string',
        'Source must be a string'
    );

    // Replace the target element's outer HTML with the source string
    target.outerHTML = source;
}

function appendContent(target, source) {
    // Assert that the resolved value is a string
    console.assert(
        typeof source === 'string',
        'Source must be a string'
    );

    // Insert the source string after the target element
    target.insertAdjacentHTML('afterend', source);
}

function prependContent(target, source) {
    // Assert that the resolved value is a string
    console.assert(
        typeof source === 'string',
        'Source must be a string'
    );

    // Insert the source string before the target element
    target.insertAdjacentHTML('beforebegin', source);
}

function processTarget(target, source, action) {
    // Assert that target is either an HTML element or a string selector
    console.assert(
        target instanceof HTMLElement || typeof target === 'string',
        'Target must be an HTML element or a string selector'
    );

    // If target is a string selector, find the corresponding HTML element
    if (typeof target === 'string') {
        target = document.querySelector(target);

        // Assert that the target element exists in the DOM
        console.assert(target !== null, `No element found for selector: ${target}`);
    }

    // Assert that source is either a string or a promise
    console.assert(
        typeof source === 'string' || source instanceof Promise,
        'Source must be a string or a promise'
    );

    // If source is a promise, wait for it to resolve
    if (source instanceof Promise) {
        source.then(data => {
            action(target, data);
        }).catch(error => {
            console.error('Error:', error);
        });
    } else {
        action(target, source);
    }
}

export function xReplace(target, source) {
    processTarget(target, source, replaceContent);
}

export function xAppend(target, source) {
    processTarget(target, source, appendContent);
}

export function xPrepend(target, source) {
    processTarget(target, source, prependContent);
}