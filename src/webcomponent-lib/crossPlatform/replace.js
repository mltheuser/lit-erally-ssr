/*
/ - target can be either a HTMLElement or a selector string.
/ - source can be either a string or a promise resolving to a string.
*/
export default function replace(target, source) {
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
            // Assert that the resolved value is a string
            console.assert(
                typeof data === 'string',
                'Promise must resolve to a string'
            );

            // Replace the target element's outer HTML with the resolved string
            target.outerHTML = data;
        }).catch(error => {
            console.error('Error:', error);
        });
    } else {
        // If source is a string, directly replace the target element's outer HTML
        target.outerHTML = source;
    }
}