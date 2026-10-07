import { component$, useResource$, Resource } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

type BlogMeta = { slug: string; title: string; created_at: string };

const navStyle = {
  display: "flex",
  flexDirection: "row" as const,
  gap: "1.4rem",
  position: "static" as const,
  background: "transparent",
  border: "none",
  padding: 0,
};

const navLinkStyle = { padding: 0, border: "none" };

export default component$(() => {
  const blogsResource = useResource$<BlogMeta[]>(async () => {
    const response = await fetch("https://backend.atrikumar31.workers.dev/api/blogs");
    if (!response.ok) throw new Error("Failed to fetch blogs");
    return response.json();
  });

  return (
    <>
      <header class="nav">
        <a class="mark" href="/">AD</a>
        <nav style={navStyle}>
          <a href="/" style={navLinkStyle}>Home</a>
          <a href="/journals" style={navLinkStyle}>Journals</a>
        </nav>
      </header>

      <main class="band" style={{ minHeight: "100vh", paddingBottom: "6rem", maxWidth: "800px", margin: "0 auto" }}>
        <p class="kicker">Writing</p>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(3rem, 8vw, 6rem)", margin: "0 0 3rem 0", lineHeight: 0.9, fontWeight: 500 }}>
          Blog
        </h1>

        <Resource
          value={blogsResource}
          onPending={() => <p style={{ color: "var(--muted)" }}>Loading thoughts...</p>}
          onRejected={(error) => <p style={{ color: "#ff6b6b" }}>Failed to load: {error.message}</p>}
          onResolved={(blogs) => (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {blogs.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "1.15rem" }}>No posts yet.</p>
              ) : (
                blogs.map((blog) => (
                  <article key={blog.slug} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "2rem" }}>
                    <a href={`/blog/${blog.slug}`} style={{ display: "block" }}>
                      <time style={{ color: "var(--accent)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                        {new Date(blog.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </time>
                      <h2 style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "2rem", fontWeight: 500, color: "var(--ink)" }}>
                        {blog.title}
                      </h2>
                      <span style={{ color: "var(--muted)", marginTop: "0.5rem", display: "inline-block" }}>Read post →</span>
                    </a>
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

export const head: DocumentHead = { title: "Blog — Arjun Dubey" };
