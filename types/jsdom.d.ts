declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>)
    readonly window: Window & { DOMParser: typeof DOMParser; HTMLElement: typeof HTMLElement }
  }
}