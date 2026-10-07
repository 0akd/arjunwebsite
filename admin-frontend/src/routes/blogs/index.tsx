import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

type BlogMeta = { slug: string; title: string; created_at: string };

export default component$(() => {
  const isSubmitting = useSignal(false);
  const message = useSignal("");
  const blogs = useSignal<BlogMeta[]>([]);
  const editingSlug = useSignal<string | null>(null);

  const secret = useSignal("");
  const title = useSignal("");
  const bodyText = useSignal("");

  const fetchBlogs = $(async () => {
    try {
      const res = await fetch("https://backend.atrikumar31.workers.dev/api/blogs");
      if (res.ok) blogs.value = await res.json();
    } catch (e) {
      console.error("Failed to fetch blogs", e);
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => { fetchBlogs(); });

  const handleSubmit = $(async (event: Event, element: HTMLFormElement) => {
    isSubmitting.value = true;
    message.value = "";

    const formData = new FormData(element);
    const url = editingSlug.value
      ? `https://backend.atrikumar31.workers.dev/api/blogs/${editingSlug.value}`
      : "https://backend.atrikumar31.workers.dev/api/blogs";

    try {
      const response = await fetch(url, { method: editingSlug.value ? "PUT" : "POST", body: formData });
      if (response.ok) {
        message.value = editingSlug.value ? "Blog updated successfully!" : "Blog published!";
        editingSlug.value = null;
        title.value = "";
        bodyText.value = "";
        fetchBlogs();
      } else {
        const data = await response.json();
        message.value = `Error: ${data.error || "Failed to save blog"}`;
      }
    } catch (error) {
      message.value = "Error connecting to backend.";
    } finally {
      isSubmitting.value = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  const handleEdit = $(async (slug: string) => {
    try {
      const res = await fetch(`https://backend.atrikumar31.workers.dev/api/blogs/${slug}`);
      if (res.ok) {
        const blog = await res.json();
        editingSlug.value = blog.slug;
        title.value = blog.title;
        bodyText.value = blog.body;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      console.error(e);
    }
  });

  const handleDelete = $(async (slug: string) => {
    if (!secret.value) {
      message.value = "Error: Secret Key required to delete.";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!confirm(`Are you sure you want to delete /${slug}?`)) return;

    try {
      const res = await fetch(`https://backend.atrikumar31.workers.dev/api/blogs/${slug}`, {
        method: "DELETE",
        headers: { Authorization: secret.value },
      });
      if (res.ok) {
        if (editingSlug.value === slug) {
          editingSlug.value = null;
          title.value = "";
          bodyText.value = "";
        }
        fetchBlogs();
      }
    } catch (e) {
      console.error(e);
    }
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <nav style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <a href="/">← Journals</a>
        <a href="/todos">Manage Todos</a>
      </nav>

      <h1>Blog Admin (Markdown)</h1>

      <form preventdefault:submit onSubmit$={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px" }}>
        <h2>{editingSlug.value ? "Edit Blog" : "Write New Blog"}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="secret" style={{ fontWeight: "bold" }}>Admin Secret Key</label>
          <input type="password" id="secret" name="secret" bind:value={secret} required style={{ padding: "0.5rem" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="title" style={{ fontWeight: "bold" }}>Blog Title</label>
          <input type="text" id="title" name="title" bind:value={title} required style={{ padding: "0.5rem" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="body" style={{ fontWeight: "bold" }}>Body (Markdown)</label>
          <textarea id="body" name="body" bind:value={bodyText} required rows={16} style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "14px", lineHeight: 1.5, resize: "vertical" }} placeholder="Write your markdown here..."></textarea>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button type="submit" disabled={isSubmitting.value} style={{ flex: 1, padding: "0.75rem", background: "#000", color: "#fff", border: "none", cursor: isSubmitting.value ? "not-allowed" : "pointer", fontWeight: "bold", borderRadius: "4px" }}>
            {isSubmitting.value ? "Saving..." : editingSlug.value ? "Update Blog" : "Publish Blog"}
          </button>
          {editingSlug.value && (
            <button type="button" onClick$={() => { editingSlug.value = null; title.value = ""; bodyText.value = ""; }} style={{ padding: "0.75rem", background: "#e5e7eb", color: "#374151", border: "none", cursor: "pointer", fontWeight: "bold", borderRadius: "4px" }}>Cancel</button>
          )}
        </div>

        {message.value && (
          <div style={{ padding: "1rem", background: message.value.includes("Error") ? "#fee2e2" : "#dcfce7", color: message.value.includes("Error") ? "#991b1b" : "#166534", borderRadius: "4px" }}>
            {message.value}
          </div>
        )}
      </form>

      <div style={{ marginTop: "3rem" }}>
        <h2>Existing Blogs</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {blogs.value.length === 0 ? <p>No blogs yet.</p> : blogs.value.map((blog) => (
            <div key={blog.slug} style={{ border: "1px solid #e5e7eb", padding: "1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ display: "block" }}>{blog.title}</strong>
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>/{blog.slug}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick$={() => handleEdit(blog.slug)} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px" }}>Edit</button>
                <button type="button" onClick$={() => handleDelete(blog.slug)} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#fee2e2", color: "#991b1b", border: "1px solid #f87171", borderRadius: "4px" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = { title: "Admin Dashboard - Blogs" };
