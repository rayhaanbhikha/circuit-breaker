export class CallsNotPermittedException extends Error {
  constructor(message: string) {
    super(message);
    // this.name = message;
  }
}
