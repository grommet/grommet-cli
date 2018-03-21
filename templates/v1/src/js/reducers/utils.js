export function createReducer(initialState, handlers) {
  return (state = initialState, action) => {
    const handler = handlers[action.type];
    if (!handler) return state;
    return { ...state, ...handler(state, action) };
  };
}

export default { createReducer };
