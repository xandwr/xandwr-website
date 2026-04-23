<script lang="ts">
  interface Line {
    id: number;
    text: string;
  }

  interface Props {
    initial?: string[];
  }

  let { initial = ['Hello, world.'] }: Props = $props();

  let nextId = 0;
  let lines = $state<Line[]>(initial.map((text) => ({ id: nextId++, text })));

  export function print(text: string) {
    lines.push({ id: nextId++, text });
  }

  export function clear() {
    lines = [];
  }
</script>

<pre class="terminal" role="log" aria-live="polite">
  {#each lines as line (line.id)}<div class="line">{line.text}</div>{/each}
</pre>

<style>
  .terminal {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--color-fg);
    background: var(--color-bg);
    padding: 1rem 1.25rem;
    margin: 0;
    border-radius: 2px;
    border: 1px solid var(--color-rule);
    overflow: auto;
    white-space: pre-wrap;
    height: 100%;
    word-break: break-word;
  }

  .line {
    min-height: 1.5em;
  }
</style>
