import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'CertiApp',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css',
        },
      ],
      script: [
        {
          // Evita el parpadeo en la primera visita (sin cookie) si el sistema está en modo oscuro
          innerHTML: "if(!/(^|; )theme=/.test(document.cookie)&&matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')",
          tagPosition: 'head',
        },
      ],
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})
