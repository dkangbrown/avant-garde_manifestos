import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import Button from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { wait } from "@testing-library/user-event/dist/utils";

/**
 * Grid‑based text‑building UI
 * -----------------------------------------------------
 * ‣ The user types the first word, which is fixed at (0,0).
 * ‣ Three backend suggestions appear at (0,1), (1,0), (1,1).
 * ‣ The user clicks one; it is fixed and becomes the next anchor.
 * ‣ Loop until the user presses Enter → POST full grid to backend.
 *
 * Visual implementation notes
 * ---------------------------
 * • Each cell is rendered as a <Card> positioned absolutely inside a large scrollable canvas.
 * • The canvas grows automatically based on the maximum row / column reached.
 * • Suggestions are visually distinguished by a hover style & pointer cursor.
 */

const CELL_SIZE = 140; // px – adjust to taste

interface FixedCell {
  word: string;
  row: number;
  col: number;
}

interface SuggestionCell extends FixedCell {}

export default function GridTextBuilder() {
  /* ----------------------------- state ----------------------------- */
  const [cells, setCells] = useState<Record<string, FixedCell>>({});
  const [suggestions, setSuggestions] = useState<SuggestionCell[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [promptText, setPromptText] = useState("<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are an Avant-Garde artist, one of the Cubists, Futurists, Orphists, Dadaists, or Surrealists who, in the turn of the twentieth century, witnessed an explosion of artistic movements and of the traditions which preceded them. You undertook reevaluations of art’s relationship to society, as well as to its possible pasts, presents, and futures.<|eot_id|><|start_header_id|>user<|end_header_id|>\nWrite me an Avant-Garde manifesto.<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n");
  const [stage, setStage] = useState<"initial" | "running">("initial");

  /* Keep track of grid size so the scrollable canvas expands */
  const maxRow = useRef(0);
  const maxCol = useRef(0);

  /* ------------------------- backend hooks ------------------------- */
  async function fetchSuggestionsFromBackend(word: string): Promise<string[]> {
    // 🔗 Replace with your real API call (e.g., /api/suggest?seed=word)
    const completion = await fetch("https://api.fireworks.ai/inference/v1/completions", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer fw_3ZSSPjwsMnXbzxaua7fFxrN6"
      },
      body: JSON.stringify({
        model: "accounts/dongyoon-kang-a70308/deployedModels/ft-avant-garde-v3-prompt-ztdr0bwe",
        max_tokens: 1,
        logprobs: 3,
        top_p: 1,
        top_k: 40,
        presence_penalty: 0,
        frequency_penalty: 0,
        temperature: 0.5,
        prompt: promptText + word,
      })
    });

    // decode and return the top 3 suggestions
    const completionJSON = await completion.json();
    console.log(completionJSON);
    const options =  completionJSON.choices[0].logprobs.top_logprobs[0];
    return Object.keys(options);
  }

  function exportToCsv(filename : string, data: string[][]) {
    function arrayToCsv(data: string[][]){
      return data.map(row =>
        row
        .map(String)  // convert every value to String
        .map(v => v.replaceAll('"', '""'))  // escape double quotes
        .map(v => `"${v}"`)  // quote it
        .join(',')  // comma-separated
      ).join('\r\n');  // rows starting on new lines
    }

    function downloadBlob(content: string, filename: string, contentType: string) {
      // Create a blob
      var blob = new Blob([content], { type: contentType });
      var url = URL.createObjectURL(blob);
    
      // Create a link to download it
      var pom = document.createElement('a');
      pom.href = url;
      pom.setAttribute('download', filename);
      pom.click();
    }

    downloadBlob(arrayToCsv(data), filename, 'text/csv;charset=utf-8;')
  }

  async function postGridToBackend() {
    const payload = Object.values(cells).map(({ word, row, col }) => ({ word, row, col }));
    console.log("posting grid to backend", payload);
    const exportArray = new Array(maxRow.current);
    for (let i = 0; i < maxRow.current; i++) {
      const row = new Array(maxCol.current);
      exportArray[i] = row.fill("");
    }
    for (let i = 0; i < payload.length; i++) {
      const { word, row, col } = payload[i];
      exportArray[row][col] = word;
    }
    exportToCsv("my-avant-garde-manifesto.csv", exportArray);
    // await fetch("/api/submit", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ grid: payload }),
    // });
  }

  /* ------------------------ helper utilities ----------------------- */
  const key = (row: number, col: number) => `${row},${col}`;

  function addFixedCell(row: number, col: number, word: string) {
    setCells((prev) => ({ ...prev, [key(row, col)]: { row, col, word } }));
    console.log("prompt before", promptText);
    console.log("adding word", word);
    setPromptText(promptText + word);
    console.log("updated prompt text", promptText);
    maxRow.current = Math.max(maxRow.current, row);
    maxCol.current = Math.max(maxCol.current, col);
  }

  async function placeSuggestions(baseRow: number, baseCol: number, word: string) {
    console.log("fetching suggestions for", promptText + word);
    const words = await fetchSuggestionsFromBackend(word);
    const coords = [
      { row: baseRow, col: baseCol + 1 },
      { row: baseRow + 1, col: baseCol },
      { row: baseRow + 1, col: baseCol + 1 },
    ];
    setSuggestions(coords.map((c, idx) => ({ ...c, word: words[idx] })));
    maxRow.current = Math.max(maxRow.current, baseRow + 1);
    maxCol.current = Math.max(maxCol.current, baseCol + 1);
  }

  /* ---------------------------- events ----------------------------- */
  async function handleInitialSubmit() {
    if (!inputValue.trim()) return;
    addFixedCell(0, 0, inputValue.trim());
    console.log("about to query", promptText);
    await placeSuggestions(0, 0, inputValue.trim());
    setStage("running");
    setInputValue("");
  }

  async function handleSuggestionClick(s: SuggestionCell) {
    addFixedCell(s.row, s.col, s.word);
    console.log("about to query", promptText);
    await placeSuggestions(s.row, s.col, s.word);
  }

  function handleGlobalKey(e: KeyboardEvent<HTMLDivElement>) {
    if (stage === "running" && e.key === "Enter") {
      void postGridToBackend();
    }
  }

  /* --------------------------- UI layout --------------------------- */
  const canvasStyle = {
    width: (maxCol.current + 3) * CELL_SIZE,
    height: (maxRow.current + 3) * CELL_SIZE,
    overflow: "auto",
    position: "relative"
  } as const;

  return (
    <div
      className="w-screen h-screen overflow-scroll bg-white select-none"
      tabIndex={0}
      onKeyDown={handleGlobalKey}
    >
      {/* scrollable canvas */}
      <div className="relative" style={canvasStyle}>
        {/* fixed words */}
        {Object.values(cells).map(({ row, col, word }) => (
          <Card
            key={key(row, col)}
            style={{ position: "absolute", left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
          >
            <CardContent style={{display: "flex", justifyContent: "center", width: CELL_SIZE, height: CELL_SIZE, alignItems: "center"}}>
              {word}
            </CardContent>
          </Card>
        ))}

        {/* clickable suggestions */}
        {suggestions.map((s, i) => (
          <Card
            key={`s-${i}`}
            onClick={() => handleSuggestionClick(s)}
            className="absolute cursor-pointer transition-colors hover:bg-muted/50"
            style={{ border: "solid", position: "absolute",  left: s.col * CELL_SIZE, top: s.row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
          >
            <CardContent style={{display: "flex", justifyContent: "center", width: CELL_SIZE, height: CELL_SIZE, alignItems: "center"}}>
              {s.word}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* first‑word overlay */}
      {stage === "initial" && (
        <div style={{ position: "absolute", top: 4, left: 4, display: "flex", gap: 2 }}>
          <input
            value={inputValue}
            placeholder="Type first word …"
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleInitialSubmit();
            }}
            style={{display: "flex", justifyContent: "center", width: CELL_SIZE, height: CELL_SIZE, alignItems: "center"}}
          />
          {/* <Button onClick={handleInitialSubmit}>Start</Button> */}
        </div>
      )}

      {/* finish button */}
      {stage === "running" && (
        <Button
          onClick={() => {
            void postGridToBackend();
          }}
          className="fixed bottom-5 right-5"
        >
          Save
        </Button>
      )}
    </div>
  );
}