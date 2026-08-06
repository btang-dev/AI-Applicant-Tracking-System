import { create } from "zustand";

declare global {
  interface Window {
    puter: {
      auth: {
        getUser: () => Promise<PuterUser>;
        isSignedIn: () => Promise<boolean>;
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
      };
      fs: {
        write: (
          path: string,
          data: string | File | Blob
        ) => Promise<File | undefined>;
        read: (path: string) => Promise<Blob>;
        upload: (file: File[] | Blob[]) => Promise<FSItem>;
        delete: (path: string) => Promise<void>;
        readdir: (path: string) => Promise<FSItem[] | undefined>;
      };
      ai: {
        chat: (
          prompt: string | ChatMessage[],
          imageURL?: string | PuterChatOptions,
          testMode?: boolean,
          options?: PuterChatOptions
        ) => Promise<Object>;
        img2txt: (
          image: string | File | Blob,
          testMode?: boolean
        ) => Promise<string>;
      };
      kv: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        del: (key: string) => Promise<boolean>;
        list: (pattern: string, returnValues?: boolean) => Promise<string[]>;
        flush: () => Promise<boolean>;
      };
    };
  }
}

interface PuterStore {
  isLoading: boolean;
  error: string | null;
  puterReady: boolean;
  auth: {
    user: PuterUser | null;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkAuthStatus: () => Promise<boolean>;
    getUser: () => PuterUser | null;
  };
  fs: {
    write: (
      path: string,
      data: string | File | Blob
    ) => Promise<File | undefined>;
    read: (path: string) => Promise<Blob | undefined>;
    upload: (file: File[] | Blob[]) => Promise<FSItem | undefined>;
    delete: (path: string) => Promise<void>;
    readDir: (path: string) => Promise<FSItem[] | undefined>;
  };
  ai: {
    chat: (
      prompt: string | ChatMessage[],
      imageURL?: string | PuterChatOptions,
      testMode?: boolean,
      options?: PuterChatOptions
    ) => Promise<AIResponse | undefined>;
    feedback: (
      path: string,
      message: string
    ) => Promise<AIResponse | undefined>;
    img2txt: (
      image: string | File | Blob,
      testMode?: boolean
    ) => Promise<string | undefined>;
  };
  kv: {
    get: (key: string) => Promise<string | null | undefined>;
    set: (key: string, value: string) => Promise<boolean | undefined>;
    delete: (key: string) => Promise<boolean | undefined>;
    list: (
      pattern: string,
      returnValues?: boolean
    ) => Promise<string[] | KVItem[] | undefined>;
    flush: () => Promise<boolean | undefined>;
  };

  init: () => void;
  clearError: () => void;
}

const PUTER_SCRIPT_URL = "https://js.puter.com/v2/";
let puterLoadPromise: Promise<typeof window.puter | null> | null = null;

const getPuter = (): typeof window.puter | null =>
  typeof window !== "undefined" && window.puter ? window.puter : null;

export const isPuterAuthApiReady = (
  puter: typeof window.puter | null
): puter is typeof window.puter =>
  Boolean(
    puter &&
      puter.auth &&
      typeof puter.auth.signIn === "function" &&
      typeof puter.auth.signOut === "function" &&
      typeof puter.auth.isSignedIn === "function" &&
      typeof puter.auth.getUser === "function"
  );

const waitForPuterAuthReady = async (
  timeoutMs = 5000
): Promise<typeof window.puter | null> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const puter = getPuter();

    if (isPuterAuthApiReady(puter)) {
      return puter;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return getPuter();
};

const ensurePuterLoaded = async (): Promise<typeof window.puter | null> => {
  const existingPuter = getPuter();
  if (existingPuter) {
    return existingPuter;
  }

  if (puterLoadPromise) {
    return puterLoadPromise;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  puterLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.puter.com/v2/"]'
    );

    if (existingScript) {
      if (
        existingScript.dataset.puterLoaded === "true" ||
        isPuterAuthApiReady(getPuter())
      ) {
        existingScript.dataset.puterLoaded = "true";
        void (async () => {
          resolve(await waitForPuterAuthReady());
        })();
        return;
      }

      existingScript.addEventListener(
        "load",
        () => {
          existingScript.dataset.puterLoaded = "true";
          void (async () => {
            resolve(await waitForPuterAuthReady());
          })();
        },
        { once: true }
      );
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Puter.js")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PUTER_SCRIPT_URL;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.puterLoaded = "true";
        void (async () => {
          resolve(await waitForPuterAuthReady());
        })();
      },
      { once: true }
    );
    script.addEventListener("error", () => {
      reject(new Error("Failed to load Puter.js"));
    }, { once: true });
    document.head.appendChild(script);
  });

  try {
    return await puterLoadPromise;
  } catch (error) {
    puterLoadPromise = null;
    throw error;
  }
};

export const usePuterStore = create<PuterStore>((set, get) => {
  const setError = (msg: string) => {
    set({
      error: msg,
      isLoading: false,
      auth: {
        user: null,
        isAuthenticated: false,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: get().auth.getUser,
      },
    });
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return false;
      }

      set({ isLoading: true, error: null });

      try {
        const isSignedIn = await puter.auth.isSignedIn();
        if (isSignedIn) {
          const user = await puter.auth.getUser();
          set({
            auth: {
              user,
              isAuthenticated: true,
              signIn: get().auth.signIn,
              signOut: get().auth.signOut,
              refreshUser: get().auth.refreshUser,
              checkAuthStatus: get().auth.checkAuthStatus,
              getUser: () => user,
            },
            isLoading: false,
          });
          return true;
        } else {
          set({
            auth: {
              user: null,
              isAuthenticated: false,
              signIn: get().auth.signIn,
              signOut: get().auth.signOut,
              refreshUser: get().auth.refreshUser,
              checkAuthStatus: get().auth.checkAuthStatus,
              getUser: () => null,
            },
            isLoading: false,
          });
          return false;
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to check auth status";
        setError(msg);
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load Puter";
      setError(msg);
      return false;
    }
  };

  const signIn = async (): Promise<void> => {
    try {
      // Attempt to open a placeholder popup synchronously so the browser
      // considers the auth flow a user gesture. If this fails, the popup
      // was blocked and we bail early with a helpful message.
      let placeholderPopup: Window | null = null;
      try {
        if (typeof window !== "undefined") {
          placeholderPopup = window.open(
            "",
            "puter_auth_window",
            "width=700,height=700"
          );
          if (!placeholderPopup) {
            setError("The sign-in popup was blocked by the browser.");
            return;
          }
        }
      } catch (openErr) {
        // If window.open throws, treat as blocked.
        setError("The sign-in popup was blocked by the browser.");
        return;
      }

      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        // close placeholder if still open
        try {
          if (placeholderPopup && !placeholderPopup.closed) placeholderPopup.close();
        } catch (e) {}
        return;
      }

      set({ isLoading: true, error: null });

      try {
        await puter.auth.signIn();
        await checkAuthStatus();
      } catch (err) {
        // Log the raw error to the console so DevTools shows the failure
        // eslint-disable-next-line no-console
        console.error("Puter signIn failed", err);
        const msg = err instanceof Error ? err.message : "Sign in failed";
        setError(msg);
      } finally {
        // close placeholder if still open
        try {
          if (placeholderPopup && !placeholderPopup.closed) placeholderPopup.close();
        } catch (e) {}
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load Puter";
      setError(msg);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }

      set({ isLoading: true, error: null });

      try {
        await puter.auth.signOut();
        set({
          auth: {
            user: null,
            isAuthenticated: false,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => null,
          },
          isLoading: false,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign out failed";
        setError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load Puter";
      setError(msg);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const user = await puter.auth.getUser();
        set({
          auth: {
            user,
            isAuthenticated: true,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => user,
          },
          isLoading: false,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to refresh user";
        setError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load Puter";
      setError(msg);
    }
  };

  const init = (): void => {
    void ensurePuterLoaded()
      .then((puter) => {
        if (!puter) {
          setError("Puter.js not available");
          return;
        }

        set({ puterReady: true });
        void checkAuthStatus();
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : "Puter.js failed to load";
        setError(msg);
      });
  };

  const write = async (path: string, data: string | File | Blob) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.fs.write(path, data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to write file";
      setError(msg);
    }
  };

  const readDir = async (path: string) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.fs.readdir(path);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to read directory";
      setError(msg);
    }
  };

  const readFile = async (path: string) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.fs.read(path);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to read file";
      setError(msg);
    }
  };

  const upload = async (files: File[] | Blob[]) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.fs.upload(files);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload file";
      setError(msg);
    }
  };

  const deleteFile = async (path: string) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.fs.delete(path);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete file";
      setError(msg);
    }
  };

  const chat = async (
    prompt: string | ChatMessage[],
    imageURL?: string | PuterChatOptions,
    testMode?: boolean,
    options?: PuterChatOptions
  ) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.ai.chat(prompt, imageURL, testMode, options) as Promise<
        AIResponse | undefined
      >;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI chat failed";
      setError(msg);
    }
  };

  const feedback = async (path: string, message: string) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }

      return puter.ai.chat(
        [
          {
            role: "user",
            content: [
              {
                type: "file",
                puter_path: path,
              },
              {
                type: "text",
                text: message,
              },
            ],
          },
        ],
        { model: "anthropic/claude-sonnet-5" }
      ) as Promise<AIResponse | undefined>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Feedback failed";
      setError(msg);
    }
  };

  const img2txt = async (image: string | File | Blob, testMode?: boolean) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.ai.img2txt(image, testMode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Image OCR failed";
      setError(msg);
    }
  };

  const getKV = async (key: string) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.kv.get(key);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "KV read failed";
      setError(msg);
    }
  };

  const setKV = async (key: string, value: string) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.kv.set(key, value);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "KV write failed";
      setError(msg);
    }
  };

  const deleteKV = async (key: string) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.kv.del(key);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "KV delete failed";
      setError(msg);
    }
  };

  const listKV = async (pattern: string, returnValues?: boolean) => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      if (returnValues === undefined) {
        returnValues = false;
      }
      return puter.kv.list(pattern, returnValues);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "KV list failed";
      setError(msg);
    }
  };

  const flushKV = async () => {
    try {
      const puter = await ensurePuterLoaded();
      if (!puter) {
        setError("Puter.js not available");
        return;
      }
      return puter.kv.flush();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "KV flush failed";
      setError(msg);
    }
  };

  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser,
      checkAuthStatus,
      getUser: () => get().auth.user,
    },
    fs: {
      write: (path: string, data: string | File | Blob) => write(path, data),
      read: (path: string) => readFile(path),
      readDir: (path: string) => readDir(path),
      upload: (files: File[] | Blob[]) => upload(files),
      delete: (path: string) => deleteFile(path),
    },
    ai: {
      chat: (
        prompt: string | ChatMessage[],
        imageURL?: string | PuterChatOptions,
        testMode?: boolean,
        options?: PuterChatOptions
      ) => chat(prompt, imageURL, testMode, options),
      feedback: (path: string, message: string) => feedback(path, message),
      img2txt: (image: string | File | Blob, testMode?: boolean) =>
        img2txt(image, testMode),
    },
    kv: {
      get: (key: string) => getKV(key),
      set: (key: string, value: string) => setKV(key, value),
      delete: (key: string) => deleteKV(key),
      list: (pattern: string, returnValues?: boolean) =>
        listKV(pattern, returnValues),
      flush: () => flushKV(),
    },
    init,
    clearError: () => set({ error: null }),
  };
});
