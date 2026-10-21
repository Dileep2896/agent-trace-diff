import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TraceDiffView } from "./TraceDiffView";
import { MemoryTraceClient } from "@/lib/traces/mock";
async function setup() {
  const client = new MemoryTraceClient({
    delay: false,
    storage: localStorage,
  });
  const pairs = await client.listTracePairs();
  const initialPair = {
    id: pairs[0].id,
    baseline: await client.getTrace(pairs[0].baselineId),
    candidate: await client.getTrace(pairs[0].candidateId),
  };
  render(
    <TraceDiffView pairs={pairs} initialPair={initialPair} client={client} />,
  );
  return { user: userEvent.setup(), client, initialPair };
}
beforeEach(() => localStorage.clear());
describe("Trace Diff workflow", () => {
  it("renders step 5 divergence and opens a JSON detail panel on row selection", async () => {
    const { user } = await setup();
    expect(screen.getByText(/Diverged at step 5/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Step 5: bureau_score_lookup, changed/ }),
    );
    const details = screen.getByRole("complementary", { name: "Span details" });
    expect(within(details).getByText("args.region")).toBeInTheDocument();
    expect(within(details).getByText(/eu-west/)).toBeInTheDocument();
  });
  it("switches to the no-regression control", async () => {
    const { user } = await setup();
    await user.selectOptions(screen.getByLabelText("Trace pair"), "control");
    expect(
      await screen.findByText("No divergence: runs match"),
    ).toBeInTheDocument();
  });
  it("shows friendly validation errors for bad pasted JSON", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Import traces" }));
    await user.type(screen.getByLabelText("Baseline JSON"), "not json");
    await user.click(screen.getByRole("button", { name: "Compare traces" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid JSON/i);
  });
  it("creates a test case and exposes it in the regression dataset", async () => {
    const { user, client } = await setup();
    await user.click(
      screen.getByRole("button", { name: "Turn into regression test" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/TC-/);
    await user.click(
      screen.getByRole("button", { name: /Regression dataset/ }),
    );
    const drawer = screen.getByRole("dialog", { name: "Regression dataset" });
    expect(
      await within(drawer).findByText(/^TC-[A-F0-9]+$/),
    ).toBeInTheDocument();
    expect(await client.listRegressionTestCases()).toHaveLength(1);
  });
  it("supports keyboard navigation without intercepting form input", async () => {
    const { user } = await setup();
    await user.click(
      screen.getByRole("button", { name: /Step 5: bureau_score_lookup, changed/ }),
    );
    await user.keyboard("j{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Step 6: bureau_score_lookup, changed/ }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
  });
  it("imports a valid pair and compares it", async () => {
    const { user, initialPair } = await setup();
    await user.click(screen.getByRole("button", { name: "Import traces" }));
    await user.click(screen.getByLabelText("Baseline JSON"));
    await user.paste(JSON.stringify(initialPair.baseline));
    await user.click(screen.getByLabelText("Candidate JSON"));
    await user.paste(JSON.stringify(initialPair.candidate));
    await user.click(screen.getByRole("button", { name: "Compare traces" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Trace pair")).toHaveValue("imported");
    expect(screen.getByText(/Diverged at step 5/)).toBeInTheDocument();
  });
});
