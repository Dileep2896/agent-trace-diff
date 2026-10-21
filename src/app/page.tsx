import { MemoryTraceClient } from "@/lib/traces/mock";
import { TraceDiffView } from "@/components/diff/TraceDiffView";
export default async function Home() {
  const client = new MemoryTraceClient({ delay: false });
  const pairs = await client.listTracePairs();
  const [baseline, candidate] = await Promise.all([
    client.getTrace(pairs[0].baselineId),
    client.getTrace(pairs[0].candidateId),
  ]);
  return (
    <TraceDiffView
      pairs={pairs}
      initialPair={{ id: pairs[0].id, baseline, candidate }}
    />
  );
}
