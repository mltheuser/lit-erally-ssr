export default class JSONParser {
    static safeJSONParse(value) {
        try {
            return JSON.parse(value)
        } catch {
            return value
        }
    }
}