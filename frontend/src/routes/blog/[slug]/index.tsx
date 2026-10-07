import { component$, useResource$, Resource } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import { marked } from "marked";

type BlogDetail = { slug: string; title: string; body: string; created_at: string };

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
  const loc = useLocation();

  const blogResource = useResource$<{ blog: BlogDetail; htmlContent: string }>(async ({ track }) => {
    const slug = track(() => loc.params.slug);
    const response = await fetch(`https://backend.atrikumar31.workers.dev/api/blogs/${slug}`);
    if (!response.ok) throw new Error("Blog not found");
    const blog: BlogDetail = await response.json();

    const htmlContent = await marked.parse(blog.body);
    return { blog, htmlContent };
  });

  return (
    <>
      <header class="nav">
        <a class="mark" href="/">AD</a>
        <nav style={navStyle}>
          <a href="/" style={navLinkStyle}>Home</a>
          <a href="/blog" style={navLinkStyle}>All Posts</a>
        </nav>
      </header>

      <main class="band" style={{ minHeight: "100vh", paddingBottom: "6rem", maxWidth: "800px", margin: "0 auto" }}>
        <Resource
          value={blogResource}
          onPending={() => <p style={{ color: "var(--muted)" }}>Loading post...</p>}
          onRejected={() => <p style={{ color: "#ff6b6b" }}>Post not found.</p>}
          onResolved={({ blog, htmlContent }) => (
            <article>
              <header style={{ marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid var(--line)" }}>
                <time style={{ color: "var(--accent)", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "1rem" }}>
                  {new Date(blog.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
                <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", margin: 0, lineHeight: 1.1, fontWeight: 500, color: "var(--ink)" }}>
                  {blog.title}
                </h1>
              </header>

              <div
                class="prose blog-content"
                style={{ fontSize: "1.15rem", lineHeight: 1.8, color: "var(--ink)" }}
                dangerouslySetInnerHTML={htmlContent}
              />
            </article>
          )}
        />
      </main>
    </>
  );
});

export const head: DocumentHead = { title: "Blog Post — Arjun Dubey" };
