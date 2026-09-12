declare module "@hyperbeam/web" {
  export interface HyperbeamOptions {
    adminToken?: string;
    volume?: number;
    delegateKeyboard?: boolean;
    timeout?: {
      warning?: number;
      absolute?: number;
    };
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (err: Error) => void;
  }

  export interface HyperbeamInstance {
    destroy: () => void;
    volume: number;
    tabs?: {
      create: (url: string) => Promise<unknown>;
    };
    [key: string]: unknown;
  }

  export default function Hyperbeam(
    container: HTMLElement,
    embedUrl: string,
    options?: HyperbeamOptions
  ): Promise<HyperbeamInstance>;
}
