import type { FieldDiff } from "@/lib/diff/jsonDiff";
export function JsonDiff({ fields }: { fields: FieldDiff[] }) {
  if (!fields.length)
    return <p className="empty-diff">No semantic changes in this span.</p>;
  return (
    <div className="json-diff">
      {fields.map((field, i) => (
        <div className="json-field" key={`${field.path}-${i}`}>
          <div className="json-path">
            {field.path}
            <span>{field.kind}</span>
          </div>
          {field.kind !== "added" && (
            <pre className="json-line removed">
              <span aria-label="removed">−</span>
              <code>
                {JSON.stringify(field.before, null, 2) ?? "undefined"}
              </code>
            </pre>
          )}
          {field.kind !== "removed" && (
            <pre className="json-line added">
              <span aria-label="added">+</span>
              <code>{JSON.stringify(field.after, null, 2) ?? "undefined"}</code>
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
