export class EbookFileRetrievalError extends Error {
  constructor(message: string) {
      super(message);
      this.name = "EbookFileRetrievalError";
  }
}

export class KeyAndIVRetrievalError extends Error {
  constructor(message: string) {
      super(message);
      this.name = "KeyAndIVRetrievalError";
  }
}

export class EbookEncryptionError extends Error {
  constructor(message: string) {
      super(message);
      this.name = "EbookEncryptionError";
  }
}