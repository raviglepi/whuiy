import {bench, describe} from "vitest";

import {act, memo, useState} from "react";
import {createRoot} from "react-dom/client";

const ROWS = 1000;

function rowText(index: number): string {
  return `row ${index}`;
}

const MemoRow = memo(function MemoRow({text}: {readonly text: string}) {
  return <span style={{padding: "0.25rem"}}>{text}</span>;
});

function PlainRow({text}: {readonly text: string}) {
  return <span style={{padding: "0.25rem"}}>{text}</span>;
}

let updateMemo: ((next: readonly string[]) => void) | undefined;
let updatePlain: ((next: readonly string[]) => void) | undefined;

function List({memoized}: {readonly memoized: boolean}) {
  const [rows, setRows] = useState<readonly string[]>(() =>
    Array.from({length: ROWS}, (_, index) => rowText(index)),
  );
  if (memoized) updateMemo = setRows;
  else updatePlain = setRows;
  const Row = memoized ? MemoRow : PlainRow;
  return (
    <div>
      {rows.map((text, index) => (
        <Row key={index} text={text} />
      ))}
    </div>
  );
}

Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});

const memoHost = document.createElement("main");
const plainHost = document.createElement("main");
const memoRoot = createRoot(memoHost);
const plainRoot = createRoot(plainHost);

act(() => {
  memoRoot.render(<List memoized />);
});
act(() => {
  plainRoot.render(<List memoized={false} />);
});

let writes = 0;

function nextRows(): readonly string[] {
  writes += 1;
  const next = Array.from({length: ROWS}, (_, index) => rowText(index));
  next[0] = `row ${writes}`;
  return next;
}

describe("react 1000-row list", () => {
  bench("memoized row update", () => {
    const next = nextRows();
    act(() => {
      updateMemo?.(next);
    });
  });

  bench("plain row update", () => {
    const next = nextRows();
    act(() => {
      updatePlain?.(next);
    });
  });

  bench("mount 1000 memoized rows", () => {
    const host = document.createElement("main");
    const root = createRoot(host);
    act(() => {
      root.render(<List memoized />);
    });
  });
});
