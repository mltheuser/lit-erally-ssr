export default class Platform {
    static isClient() {
        return typeof window !== 'undefined' && window.HTMLElement && window.customElements
    }
}