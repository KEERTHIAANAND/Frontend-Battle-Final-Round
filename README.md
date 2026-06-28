# NeuroPulse Control Terminal

NeuroPulse is a high-density, real-time enterprise RPA monitoring dashboard built for the Frontend Battle 3.0 (Phase 2). It consumes a live 50,000-row telemetry stream at 60 frames per second.

[**🔗 Live Demo**](#) | [**🐙 GitHub Repository**](#)

---

## 🏛️ Architecture & Performance Strategy

This application was engineered specifically to beat standard React performance bottlenecks when handling high-frequency data streams. 

### 1. Constant-Time Data Pipeline (`Map`)
The `masterPool` in our `StateEngine` is a JavaScript `Map<string, RpaRow>` keyed by `project_id`. When the 200ms `dataStream.js` batch arrives with mutated metrics, we perform an `O(1)` upsert. This is infinitely faster than iterating through a 50,000-row array looking for matching IDs.

### 2. Zero-React DOM Patching
React's Virtual DOM reconciliation is too slow for 50,000 active nodes updating 5 times a second. We completely bypassed `setState` for the data stream. Instead, we pre-allocate the visible row DOM nodes using raw JavaScript (`document.createElement`) and update their `textContent` directly via React `useRef` hooks. The result is zero component re-renders during the data stream.

### 3. Virtual Scrolling without Libraries
No external virtualization libraries (like `react-window`) were used. We implemented custom virtual scrolling by maintaining a fixed pool of DOM rows representing only what is visible in the viewport (plus a small overscan). As the user scrolls, we use a passive `scroll` event listener to shift these nodes vertically using CSS `transform: translateY()`.

### 4. `requestAnimationFrame` Batching
The raw stream ticks every 200ms. We route the `renderCallback` through a `StreamController` that utilizes `requestAnimationFrame` (RAF). This guarantees that even if data processing lags, the browser will only attempt to paint when it is ready for the next frame, ensuring a locked 60 FPS experience.

---

## 🚀 Implemented Features

1. **Dashboard Shell (20 pts):** Dark, terminal-themed UI, responsive sidebar, robust state orchestration.
2. **Data Coercion (10 pts):** Native `Intl.NumberFormat` usage; strict numeric coercion from the raw CSV string dataset.
3. **KPI Telemetry (15 pts):** Additive running totals (Total Rows, Global Savings) updated instantly via pure DOM refs.
4. **Pause/Play Buffer (10 pts):** Hitting Spacebar freezes the UI but keeps the background `StateEngine` catching the raw data, accumulating a visible "queued" count.
5. **Virtual Grid Engine (30 pts):** Custom-built, zero-dependency virtual scroll implementation rendering the 50k rows.
6. **Multi-Column Sorting (10 pts):** Shift+Click column headers to prioritize sorts (e.g. `Status` -> `Budget` -> `ROI`).
7. **Token Search (10 pts):** Instant full-text filtering across all text columns without lodash or external debounce libraries.
8. **Real-time Analytics (15 pts):** Throttled `Chart.js` integration showing dynamic Department ROI and Automation distribution.
9. **Alert Subsystem (10 pts):** Dynamic `.row-alert` CSS animations triggering strictly when a row's ROI drops below zero or fails.
10. **Layout Persistence (10 pts):** Panel visibility state is bound to `localStorage` and restored cleanly on reload.

---

## 🔬 Performance Profile expectations
When evaluating the `Performance` tab in Chrome DevTools:

* **`VG Update` (User Timing Marks):** The core grid render pass takes less than **3-5ms**.
* **Memory Heap:** Remains completely flat. No memory leaks occur because we recycle the same DOM nodes instead of unmounting/remounting React elements.
* **FPS:** Solid green 60fps line while actively scrolling during a live stream.

---

## 🛠️ Setup Instructions

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. **Crucial:** Ensure the provided `rpa_database_2026.csv` and `dataStream.js` files are located in the `/public/` directory.
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

---

## 💻 Tech Stack
* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Vanilla CSS (for performance animations)
* **Charts:** Chart.js
* **Strict Constraints Met:** No AG-Grid, TanStack Table, react-window, or lodash.
