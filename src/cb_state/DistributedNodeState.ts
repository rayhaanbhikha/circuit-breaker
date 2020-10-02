export interface IDistributedNodeState {
  localState: string;
  lastContact: number;
  LastLocallyBrokenUntil?: number;
}

export const unmarshallNodeState = (nodeState: string) => {
  const [localState, lastContact, lastLocallyBrokenUntil] = nodeState.split(
    ":"
  );
  return {
    localState,
    lastContact,
    lastLocallyBrokenUntil,
  };
};

export const marshallNodeState = (nodeState: IDistributedNodeState) => {
  const { localState, lastContact, LastLocallyBrokenUntil } = nodeState;
  return `${localState}:${lastContact}:${LastLocallyBrokenUntil}`;
};
