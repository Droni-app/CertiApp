declare module '#app' {
  interface PageMeta {
    /** `false` para páginas públicas (sin sesión). */
    auth?: boolean
  }
}

export {}
