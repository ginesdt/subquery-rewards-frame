declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_URL: string,
      AIRSTACK_API_KEY: string,
    }
  }
}

export {}
