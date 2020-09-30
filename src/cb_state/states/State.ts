export interface State {
  state: string;
  init: () => void;
  exec: (cb: Function) => Promise<any>;
}
