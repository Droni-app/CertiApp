<template>
  <div class="relative min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
    <div class="absolute top-4 right-4">
      <ThemeToggle />
    </div>
    <div class="w-full max-w-md">
      <div class="flex flex-col items-center mb-6 text-gray-800 dark:text-gray-100">
        <i class="mdi mdi-file-certificate-outline text-5xl text-blue-600 dark:text-blue-400" />
        <h1 class="text-2xl font-semibold mt-2">CertiApp</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Certificados catastrales</p>
      </div>
      <slot />
    </div>
  </div>
</template>
