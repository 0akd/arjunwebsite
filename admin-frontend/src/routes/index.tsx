import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

type JournalEntry = {
  id: string;
  title: string;
  date: string;
  text: string;
  photoKey: string;
};

export default component$(() => {
  const isSubmitting = useSignal(false);
  const message = useSignal("");
  const journals = useSignal<JournalEntry[]>([]);
  const editingId = useSignal<string | null>(null);

  // Form bounds
  const secret = useSignal("");
  const title = useSignal("");
  const date = useSignal("");
  const text = useSignal("");

  const fetchJournals = $(async () => {
    try {
      const res = await fetch("https://backend.atrikumar31.workers.dev/api/journals");
      if (res.ok) {
        journals.value = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch journals", e);
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    fetchJournals();
  });

  const handleSubmit = $(async (event: Event, element: HTMLFormElement) => {
    isSubmitting.value = true;
    message.value = "";

    const formData = new FormData(element);
    const url = editingId.value
      ? `https://backend.atrikumar31.workers.dev/api/journals/${editingId.value}`
      : "https://backend.atrikumar31.workers.dev/api/journals";

    try {
      const response = await fetch(url, {
        method: editingId.value ? "PUT" : "POST",
        body: formData,
      });

      if (response.ok) {
        message.value = editingId.value
          ? "Journal updated successfully!"
          : "Journal created successfully!";
        editingId.value = null;
        title.value = "";
        date.value = "";
        text.value = "";
        const photo = element.querySelector<HTMLInputElement>("#photo");
        if (photo) photo.value = "";
        fetchJournals();
      } else {
        const data = await response.json();
        message.value = `Error: ${data.error || "Failed to save journal"}`;
      }
    } catch (error) {
      message.value = "Error connecting to the backend.";
      console.error(error);
    } finally {
      isSubmitting.value = false;
    }
  });

  const handleEdit = $(async (journal: JournalEntry) => {
    editingId.value = journal.id;
    title.value = journal.title;
    date.value = journal.date;
    text.value = journal.text;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const handleCancelEdit = $(() => {
    editingId.value = null;
    title.value = "";
    date.value = "";
    text.value = "";
  });

  const handleDelete = $(async (id: string) => {
    if (!secret.value) {
      message.value = "Error: Please enter the Admin Secret Key in the form above to delete.";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!confirm("Are you sure you want to delete this journal?")) return;

    try {
      const res = await fetch(`https://backend.atrikumar31.workers.dev/api/journals/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: secret.value,
        },
      });
      if (res.ok) {
        message.value = "Journal deleted successfully!";
        if (editingId.value === id) handleCancelEdit();
        fetchJournals();
      } else {
        const data = await res.json();
        message.value = `Error: ${data.error || "Failed to delete"}`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error(error);
      message.value = "Error connecting to the backend.";
    }
  });

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <nav style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <a href="/todos">Manage Todos</a>
        <a href="/blogs">Manage Blogs</a>
      </nav>

      <h1>Journal Admin</h1>

      <form
        preventdefault:submit
        onSubmit$={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          background: "#f9f9f9",
          padding: "1.5rem",
          borderRadius: "8px",
        }}
      >
        <h2>{editingId.value ? "Edit Journal" : "Create New Journal"}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="secret" style={{ fontWeight: "bold" }}>
            Admin Secret Key
          </label>
          <input
            type="password"
            id="secret"
            name="secret"
            bind:value={secret}
            required
            style={{ padding: "0.5rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="title" style={{ fontWeight: "bold" }}>
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            bind:value={title}
            required
            style={{ padding: "0.5rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="date" style={{ fontWeight: "bold" }}>
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            bind:value={date}
            required
            style={{ padding: "0.5rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="photo" style={{ fontWeight: "bold" }}>
            Photo {editingId.value && "(Leave blank to keep existing)"}
          </label>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            required={!editingId.value}
            style={{ padding: "0.5rem" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label for="text" style={{ fontWeight: "bold" }}>
            Journal Text
          </label>
          <textarea
            id="text"
            name="text"
            bind:value={text}
            rows={8}
            required
            style={{ padding: "0.5rem", fontFamily: "inherit" }}
          ></textarea>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button
            type="submit"
            disabled={isSubmitting.value}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: isSubmitting.value ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isSubmitting.value
              ? "Saving..."
              : editingId.value
                ? "Update Journal"
                : "Publish Journal"}
          </button>

          {editingId.value && (
            <button
              type="button"
              onClick$={handleCancelEdit}
              style={{
                padding: "0.75rem",
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {message.value && (
          <div
            style={{
              padding: "1rem",
              background: message.value.includes("Error") ? "#fee2e2" : "#dcfce7",
              color: message.value.includes("Error") ? "#991b1b" : "#166534",
              borderRadius: "4px",
            }}
          >
            {message.value}
          </div>
        )}
      </form>

      <div style={{ marginTop: "3rem" }}>
        <h2>Manage Existing Journals</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {journals.value.length === 0 ? (
            <p style={{ color: "#666" }}>No journals published yet.</p>
          ) : (
            journals.value.map((journal) => (
              <div
                key={journal.id}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "1rem",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ display: "block" }}>{journal.title}</strong>
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{journal.date}</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick$={() => handleEdit(journal)}
                    style={{
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick$={() => handleDelete(journal.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      background: "#fee2e2",
                      color: "#991b1b",
                      border: "1px solid #f87171",
                      borderRadius: "4px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Admin Dashboard",
};
