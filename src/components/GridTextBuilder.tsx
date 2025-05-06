import React, { useState, useRef, KeyboardEvent } from "react";
import Button from "./ui/Button";
import { Card, CardContent } from "./ui/Card";

const CELL_SIZE = 140; // px

interface Cell {
  word: string;
  row: number;
  col: number;
}

export default function GridTextBuilder() {
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [suggestions, setSuggestions] = useState<Cell[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [stage, setStage] = useState<"initial" | "running" | "done">("initial");

  const maxRow = useRef(0);
  const maxCol = useRef(0);

  const key = (r: number, c: number) => `${r},${c}`;

  /* ---------------- Backend stubs ---------------- */
  async function fetchSuggestions(seed: string): Promise<string[]> {
    // TODO: replace with real API call
    return ["alpha", "beta", "gamma"].map((w, i) => `${w}-${Date.now().toString(36).slice(-2)}${i}`);
  }

  async function postGrid() {
    const payload = Object.values(cells);
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grid: payload }),
    });
  }

  /* ---------------- Helpers ---------------- */
  function addFixedCell(row: number, col: number, word: string) {
    setCells((prev) => ({ ...prev, [key(row, col)]: { row, col, word } }));
    maxRow.current = Math.max(maxRow.current, row);
    maxCol.current = Math.max(maxCol.current, col);
  }

  async function placeSuggestions(baseRow: number, baseCol: number, anchor: string) {
    const words = await fetchSuggestions(anchor);
    const coords = [
      { row: baseRow, col: baseCol + 1 },
      { row: baseRow + 1, col: baseCol },
      { row: baseRow + 1, col: baseCol + 1 },
    ];
    setSuggestions(coords.map((c, i) => ({ ...c, word: words[i] })));
    maxRow.current = Math.max(maxRow.current, baseRow + 1);
    maxCol.current = Math.max(maxCol.current, baseCol + 1);
  }

  /* --------------- Event Handlers --------------- */
  async function handleInitialSubmit() {
    if (!inputValue.trim()) return;
    addFixedCell(0, 0, inputValue.trim());
    await placeSuggestions(0, 0, inputValue.trim());
    setInputValue("");
    setStage("running");
  }

  async function handleSuggestionClick(s: Cell) {
    addFixedCell(s.row, s.col, s.word);
    await placeSuggestions(s.row, s.col, s.word);
  }

  function handleGlobalKey(e: KeyboardEvent<HTMLDivElement>) {
    if (stage === "running" && e.key === "Enter") {
      setStage("done");
      void postGrid();
    }
  }

  /* --------------- Render --------------- */
  const canvasStyle: React.CSSProperties = {
    width: (maxCol.current + 3) * CELL_SIZE,
    height: (maxRow.current + 3) * CELL_SIZE,
  };

  return (
    <div
      className="w-screen h-screen overflow-scroll bg-white"
      tabIndex={0}
      onKeyDown={handleGlobalKey}
    >
      {/* Grid canvas */}
      <div className="relative" style={canvasStyle}>
        {/* Fixed cells */}
        {Object.values(cells).map(({ row, col, word }) => (
          <Card
            key={key(row, col)}
            style={{
              left: col * CELL_SIZE,
              top: row * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
            className="absolute pointer-events-none flex items-center justify-center text-center p-2"
          >
            <CardContent>{word}</CardContent>
          </Card>
        ))}

        {/* Suggestions */}
        {suggestions.map((s, i) => (
          <Card
            key={`s-${i}`}
            onClick={() => handleSuggestionClick(s)}
            style={{
              left: s.col * CELL_SIZE,
              top: s.row * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
            className="absolute cursor-pointer hover:bg-gray-100 flex items-center justify-center text-center p-2 transition-colors"
          >
            <CardContent>{s.word}</CardContent>
          </Card>
        ))}
      </div>

      {/* First‑word overlay */}
      {stage === "initial" && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <input
            className="border rounded px-3 py-2 shadow focus:outline-none focus:ring"
            placeholder="First word…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleInitialSubmit();
            }}
          />
          <Button onClick={handleInitialSubmit}>Start</Button>
        </div>
      )}

      {/* Finish button */}
      {stage === "running" && (
        <Button
          onClick={() => {
            setStage("done");
            void postGrid();
          }}
          className="fixed bottom-5 right-5"
        >
          Finish (Enter)
        </Button>
      )}
    </div>
  );
}
