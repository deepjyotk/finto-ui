export {};

declare global {
  interface Window {
    /** smallcase Gateway JS SDK (loaded from https://gateway.smallcase.com/scdk/...) */
    scDK?: new (config: {
      gateway: string;
      smallcaseAuthToken: string;
      config?: { amo?: boolean };
    }) => {
      triggerTransaction: (opts: {
        transactionId: string;
        brokers?: string[];
      }) => Promise<{ smallcaseAuthToken?: string }>;
    };
  }
}
