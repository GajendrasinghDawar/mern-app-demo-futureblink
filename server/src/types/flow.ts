export type AskAiRequestBody = {
  prompt?: string;
};

export type SaveFlowRequestBody = {
  prompt?: string;
  response?: string;
};

export type AskAiResponse = {
  answer: string;
};

export type SaveFlowResponse = {
  id: string;
  createdAt: string;
};
