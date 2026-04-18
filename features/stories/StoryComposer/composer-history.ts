import {
  composerReducer,
  createInitialComposerState,
  type ComposerAction,
  type ComposerState,
} from "./composer-reducer";

export type HistoryAction =
  | ComposerAction
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "COMMIT" };

export type ComposerHistoryState = {
  past: ComposerState[];
  present: ComposerState;
  future: ComposerState[];
};

const MAX_HISTORY = 50;

// Transient / high-frequency actions that update `present` without creating a
// history snapshot. Drag operations dispatch a COMMIT before they start to
// record the pre-drag state; everything in between is throwaway.
const NON_SNAPSHOTTABLE: ReadonlySet<ComposerAction["type"]> = new Set<ComposerAction["type"]>([
  "SET_DRAGGING_TEXT_LAYER",
  "SET_DRAGGING_STICKER",
  "SET_DRAGGING_MEDIA",
  "SET_TEXT_SNAP_GUIDES",
  "SET_PUBLISHING",
  "SET_IMAGE_TRANSFORM",
  "SET_IMAGE_DIMENSIONS",
  "SELECT_TEXT_LAYER",
  "SELECT_STICKER",
  "SET_TEXT_LAYERS",
  "UPDATE_STICKER",
]);

export function createInitialHistoryState(): ComposerHistoryState {
  return {
    past: [],
    present: createInitialComposerState(),
    future: [],
  };
}

export function composerHistoryReducer(
  state: ComposerHistoryState,
  action: HistoryAction
): ComposerHistoryState {
  if (action.type === "UNDO") {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }

  if (action.type === "REDO") {
    if (state.future.length === 0) return state;
    const [next, ...rest] = state.future;
    return {
      past: [...state.past, state.present],
      present: next,
      future: rest,
    };
  }

  if (action.type === "COMMIT") {
    const last = state.past[state.past.length - 1];
    if (last === state.present) return state;
    const nextPast = [...state.past, state.present];
    if (nextPast.length > MAX_HISTORY) nextPast.shift();
    return {
      past: nextPast,
      present: state.present,
      future: [],
    };
  }

  const nextPresent = composerReducer(state.present, action);
  if (nextPresent === state.present) return state;

  if (action.type === "RESET") {
    return {
      past: [],
      present: nextPresent,
      future: [],
    };
  }

  if (NON_SNAPSHOTTABLE.has(action.type)) {
    return {
      ...state,
      present: nextPresent,
    };
  }

  const nextPast = [...state.past, state.present];
  if (nextPast.length > MAX_HISTORY) nextPast.shift();

  return {
    past: nextPast,
    present: nextPresent,
    future: [],
  };
}
