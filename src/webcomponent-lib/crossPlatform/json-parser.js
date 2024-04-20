export default class JSONParser {
    static safeParse(value) {
        try {
            return JSON.parse(value);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return value;
            }
            throw error;
        }
    }

    static safeStringify(value) {
        return JSON.stringify(value, (key, value) => {
            if (typeof value === 'undefined') {
                return null;
            }
            return value;
        });
    }
}