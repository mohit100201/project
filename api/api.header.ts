let globalHeaders: Record<string, string> = {};

export const setApiHeaders = (headers: Record<string, string>) => {
  globalHeaders = { ...globalHeaders, ...headers };
};

export const getApiHeaders = () => globalHeaders;
