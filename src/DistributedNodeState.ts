export interface IDistributedNodeState {
  localState: string;
  lastContact: number;
  lastLocallyBrokenUntil: number;
}

export const unmarshallNodeState = (nodeState: string) => {
  const [localState, lastContact, lastLocallyBrokenUntil] = nodeState.split(
    ":"
  );
  return {
    localState,
    lastContact: Number(lastContact),
    lastLocallyBrokenUntil: Number(lastLocallyBrokenUntil),
  };
};

export const marshallNodeState = (nodeState: IDistributedNodeState) => {
  const { localState, lastContact, lastLocallyBrokenUntil } = nodeState;
  return `${localState}:${lastContact}:${lastLocallyBrokenUntil}`;
};
