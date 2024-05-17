import WebComponent from "../crossPlatform/web-component.js";
import { customElements } from "../crossPlatform/html-elements.js";
import axios from 'axios'

export default async function hydrate(htmlResult) {
    const { document } = htmlResult;

    // Extract unique tag names from the parsed HTML
    const tagNames = extractTagNames(document);

    // Collect script URLs from custom elements
    const scriptUrls = getScriptUrlsFromCustomElements(tagNames);

    // Add script tags for each unique script URL
    await addScriptTags(scriptUrls, document);

    return document;
}

function extractTagNames(document) {
    // Gather unique tag names from the parsed HTML
    const tagNames = new Set();
    const elements = document.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
        tagNames.add(elements[i].tagName.toLowerCase());
    }
    return tagNames;
}

function getScriptUrlsFromCustomElements(tagNames) {
    // Create a Set to store the script URLs
    const scriptUrls = new Set();

    tagNames.forEach(tagName => {
        const customElementConstructor = customElements.get(tagName);
        if (customElementConstructor && customElementConstructor.prototype instanceof WebComponent) {
            scriptUrls.add(customElementConstructor.getScriptUrl());
        }
    });

    return scriptUrls;
}

async function addScriptTags(scriptUrls, document) {
    scriptUrls = await expandScriptUrls(scriptUrls)
    // Add script tags for each unique script URL
    scriptUrls.forEach(scriptUrl => {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `
        (function() {
            var scriptUrl = '${scriptUrl}';
            var existingScript = document.querySelector('script[src="' + scriptUrl + '"]');
            if (!existingScript) {
                var newScript = document.createElement('script');
                newScript.type = 'module';
                newScript.src = scriptUrl;
                document.head.appendChild(newScript);
            }
            document.currentScript.remove();
        })();
    `;
        document.head.appendChild(scriptElement);
    });
}

async function expandScriptUrls(urls) {
    const expandedUrls = new Set();
    const pendingUrls = [...urls];

    while (pendingUrls.length > 0) {
        const url = pendingUrls.shift();
        if (!expandedUrls.has(url)) {
            expandedUrls.add(url);
            const dependencies = await getScriptDependencies(url);
            pendingUrls.push(...dependencies);
        }
    }

    return Array.from(expandedUrls);
}

async function getScriptDependencies(url) {
    try {
        const response = await axios.get(url);
        const scriptContent = response.data;
        const dependencyRegexes = [
            /import\s+\w+\s+from\s+['"](.+)['"]/g, // import defaultExport from "module-name";
            /import\s+\*\s+as\s+\w+\s+from\s+['"](.+)['"]/g, // import * as name from "module-name";
            /import\s+{[\s\w,]+}\s+from\s+['"](.+)['"]/g, // import { export1 } from "module-name";
            /import\s+{[\s\w,]+\s+as\s+[\s\w,]+}\s+from\s+['"](.+)['"]/g, // import { export1 as alias1 } from "module-name";
            /import\s+{\s+default\s+as\s+\w+\s+}\s+from\s+['"](.+)['"]/g, // import { default as alias } from "module-name";
            /import\s+{[^}]+}\s+from\s+['"](.+)['"]/g, // import { export1, export2 } from "module-name";
            /import\s+{[^}]+}\s+from\s+['"](.+)['"]/g, // import { export1, export2 as alias2, ... } from "module-name";
            /import\s+{\s+['"][^'"]+['"]\s+as\s+\w+\s+}\s+from\s+['"](.+)['"]/g, // import { "string name" as alias } from "module-name";
            /import\s+\w+,\s+{[^}]+}\s+from\s+['"](.+)['"]/g, // import defaultExport, { export1, ... } from "module-name";
            /import\s+\w+,\s+\*\s+as\s+\w+\s+from\s+['"](.+)['"]/g, // import defaultExport, * as name from "module-name";
            /import\s+['"](.+)['"]/g // import "module-name";
        ];
        const dependencies = new Set();
        for (const regex of dependencyRegexes) {
            const matches = scriptContent.matchAll(regex);
            for (const match of matches) {
                const dependencyUrl = new URL(match[1], url).href;
                dependencies.add(dependencyUrl);
            }
        }
        const dependenciesArray = Array.from(dependencies);
        return dependenciesArray;
    } catch (error) {
        console.error(`Failed to fetch script: ${url}`, error);
        return [];
    }
}