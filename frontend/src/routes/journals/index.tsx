import { component$, useResource$, Resource } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

type Journal = {
  id: string;
  title: string;
  date: string;
  text: string;
  photoKey: string;
};

export default component$(() => {
  // Fetch journals from the backend
  const journalsResource = useResource$<Journal[]>(async () => {
    // NOTE: Update this URL to your deployed Worker URL in production
    const response = await fetch("https://backend.atrikumar31.workers.dev/api/journals");
    if (!response.ok) {
      throw new Error("Failed to fetch journals");
    }
    return response.json();
  });

  return (
    <>
      <header class="nav">
        <a class="mark" href="/">
          AD
        </a>
        <nav
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "1.4rem",
            position: "static",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        >
          <a href="/" style={{ padding: 0, border: "none" }}>
            Home
          </a>
        </nav>
      </header>

      <main class="band" style={{ minHeight: "100vh", paddingBottom: "6rem" }}>
        <p class="kicker">Archive</p>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(3rem, 8vw, 6rem)",
            margin: "0 0 3rem 0",
            lineHeight: 0.9,
            fontWeight: 500,
          }}
        >
          Journals
        </h1>

        <Resource
          value={journalsResource}
          onPending={() => <p style={{ color: "var(--muted)" }}>Loading journals...</p>}
          onRejected={(error) => (
            <p style={{ color: "#ff6b6b" }}>Failed to load: {error.message}</p>
          )}
          onResolved={(journals) => (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "2rem",
              }}
            >
              {journals.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "1.15rem" }}>
                  No journals yet.
                </p>
              ) : (
                journals.map((journal) => (
                  <article
                    key={journal.id}
                    style={{
                      border: "1px solid var(--line)",
                      background: "var(--bg-raise)",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      // NOTE: Update localhost to your deployed Worker URL in production
                      src={`https://backend.atrikumar31.workers.dev/file/${journal.photoKey}`}
                      alt={journal.title}
                      width={640}
                      height={240}
                      style={{
                        width: "100%",
                        height: "240px",
                        objectFit: "cover",
                        borderBottom: "1px solid var(--line)",
                      }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        padding: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <time
                        style={{
                          color: "var(--accent)",
                          fontSize: "0.75rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                        }}
                      >
                        {new Date(journal.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "var(--serif)",
                          fontSize: "1.6rem",
                          fontWeight: 500,
                          color: "var(--ink)",
                        }}
                      >
                        {journal.title}
                      </h2>
                      <p
                        style={{
                          color: "var(--muted)",
                          margin: "0.5rem 0 0",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {journal.text}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        />
      </main>
    </>
  );
});

export const head: DocumentHead = {
  title: "Journals — Arjun Dubey",
  meta: [
    {
      name: "description",
      content: "Personal thoughts and notes.",
    },
  ],
};
