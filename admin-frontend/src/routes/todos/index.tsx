import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

type Todo = {
  id: string;
  text: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
};

export default component$(() => {
  const isSubmitting = useSignal(false);
  const message = useSignal("");
  const todos = useSignal<Todo[]>([]);

  // Track which popups are open independently
  const activeStatusPopupId = useSignal<string | null>(null);
  const activeDeletePopupId = useSignal<string | null>(null);

  const secret = useSignal("");
  const text = useSignal("");

  const fetchTodos = $(async () => {
    try {
      const res = await fetch("https://backend.atrikumar31.workers.dev/api/todos");
      if (res.ok) {
        todos.value = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch todos", e);
    }
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    fetchTodos();
  });

  const handleSubmit = $(async (event: Event, element: HTMLFormElement) => {
    isSubmitting.value = true;
    message.value = "";

    if (!secret.value) {
      message.value = "Error: Please enter the Admin Secret Key at the top.";
      window.scrollTo({ top: 0, behavior: "smooth" });
      isSubmitting.value = false;
      return;
    }

    const formData = new FormData(element);
    formData.append("secret", secret.value);

    try {
      const response = await fetch("https://backend.atrikumar31.workers.dev/api/todos", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        message.value = "Todo created successfully!";
        text.value = "";
        fetchTodos();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const data = await response.json();
        message.value = `Error: ${data.error || "Failed to save todo"}`;
      }
    } catch (error) {
      message.value = "Error connecting to backend.";
      console.error(error);
    } finally {
      isSubmitting.value = false;
    }
  });

  const handleStatusChange = $(async (todo: Todo, newStatus: string) => {
    if (!secret.value) {
      message.value = "Error: Please enter the Admin Secret Key at the top.";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const formData = new FormData();
    formData.append("secret", secret.value);
    formData.append("text", todo.text);
    formData.append("status", newStatus);

    try {
      const res = await fetch(`https://backend.atrikumar31.workers.dev/api/todos/${todo.id}`, {
        method: "PUT",
        body: formData,
      });
      if (res.ok) fetchTodos();
      else {
        const data = await res.json();
        message.value = `Error: ${data.error || "Failed to update todo"}`;
      }
    } catch (error) {
      console.error(error);
      message.value = "Error connecting to backend.";
    }
  });

  const handleDelete = $(async (id: string) => {
    if (!secret.value) {
      message.value = "Error: Please enter the Admin Secret Key at the top to delete.";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!confirm("Delete this todo?")) return;

    try {
      const res = await fetch(`https://backend.atrikumar31.workers.dev/api/todos/${id}`, {
        method: "DELETE",
        headers: { Authorization: secret.value },
      });
      if (res.ok) {
        message.value = "Todo deleted.";
        fetchTodos();
      } else {
        const data = await res.json();
        message.value = `Error: ${data.error || "Failed to delete todo"}`;
      }
    } catch (error) {
      console.error(error);
      message.value = "Error connecting to backend.";
    }
  });

  const handleGlobalReset = $(async () => {
    if (!secret.value) {
      message.value = "Error: Please enter the Admin Secret Key at the top.";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!confirm("Are you sure you want to uncomplete all todos? This sets everything to pending.")) return;

    const formData = new FormData();
    formData.append("secret", secret.value);

    try {
      const res = await fetch(`https://backend.atrikumar31.workers.dev/api/todos/reset/all`, {
        method: "PUT",
        body: formData,
      });
      if (res.ok) {
        message.value = "All todos have been reset to pending.";
        fetchTodos();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const data = await res.json();
        message.value = `Error: ${data.error || "Failed to reset todos"}`;
      }
    } catch (error) {
      console.error(error);
      message.value = "Error connecting to backend.";
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
      <nav style={{ marginBottom: "2rem" }}>
        <a href="/">← Back to Journals</a>
      </nav>

      <h1>Todo Admin</h1>

      {/* Global Admin Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          background: "#f9f9f9",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
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
            placeholder="Required for all actions"
          />
        </div>

        <button
          type="button"
          onClick$={handleGlobalReset}
          style={{
            padding: "0.75rem",
            background: "#f59e0b",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Global Reset (Uncomplete All)
        </button>

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
      </div>

      <div>
        <h2>Manage Todos</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {todos.value.length === 0 ? (
            <p style={{ color: "#666" }}>No todos yet.</p>
          ) : (
            todos.value.map((todo) => (
              <div
                key={todo.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  position: "relative",
                  background: todo.status === "completed" ? "#f3f4f6" : "#fff",
                  display: "flex",
                  alignItems: "stretch",
                  zIndex:
                    activeStatusPopupId.value === todo.id || activeDeletePopupId.value === todo.id
                      ? 20
                      : 1,
                }}
              >
                {/* Clickable Todo Body (Status Menu) */}
                <div
                  onClick$={() => {
                    activeStatusPopupId.value = activeStatusPopupId.value === todo.id ? null : todo.id;
                    activeDeletePopupId.value = null; // Close delete menu if open
                  }}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    cursor: "pointer",
                    textDecoration: todo.status === "completed" ? "line-through" : "none",
                  }}
                >
                  <strong style={{ display: "block" }}>{todo.text}</strong>
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Status: {todo.status.replace("_", " ")}
                  </span>
                </div>

                {/* Clickable Dots (Delete Menu) */}
                <div
                  onClick$={(e) => {
                    e.stopPropagation();
                    activeDeletePopupId.value = activeDeletePopupId.value === todo.id ? null : todo.id;
                    activeStatusPopupId.value = null; // Close status menu if open
                  }}
                  style={{
                    padding: "1rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "#6b7280", fontWeight: "bold" }}>⋮</span>
                </div>

                {/* Status Dropdown Popup */}
                {activeStatusPopupId.value === todo.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "1rem",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      padding: "0.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      zIndex: 10,
                      minWidth: "150px",
                    }}
                  >
                    <button
                      type="button"
                      onClick$={() => {
                        handleStatusChange(todo, "in_progress");
                        activeStatusPopupId.value = null;
                      }}
                      style={{ padding: "0.5rem", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", width: "100%", borderRadius: "4px" }}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick$={() => {
                        handleStatusChange(todo, "completed");
                        activeStatusPopupId.value = null;
                      }}
                      style={{ padding: "0.5rem", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", width: "100%", borderRadius: "4px" }}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      onClick$={() => {
                        handleStatusChange(todo, "pending");
                        activeStatusPopupId.value = null;
                      }}
                      style={{ padding: "0.5rem", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", width: "100%", borderRadius: "4px" }}
                    >
                      Pending
                    </button>
                  </div>
                )}

                {/* Delete Dropdown Popup */}
                {activeDeletePopupId.value === todo.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: "1rem",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      padding: "0.5rem",
                      display: "flex",
                      flexDirection: "column",
                      zIndex: 10,
                      minWidth: "100px",
                    }}
                  >
                    <button
                      type="button"
                      onClick$={() => {
                        handleDelete(todo.id);
                        activeDeletePopupId.value = null;
                      }}
                      style={{ padding: "0.5rem", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", width: "100%", borderRadius: "4px", color: "#991b1b" }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Todo Form Shifted to the Bottom */}
      <div style={{ marginTop: "3rem" }}>
        <h2>Add New Todo</h2>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label for="text" style={{ fontWeight: "bold" }}>
              New Task
            </label>
            <input
              type="text"
              id="text"
              name="text"
              bind:value={text}
              required
              style={{ padding: "0.5rem" }}
              placeholder="What needs to be done?"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting.value}
            style={{
              padding: "0.75rem",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: isSubmitting.value ? "not-allowed" : "pointer",
              fontWeight: "bold",
              borderRadius: "4px",
            }}
          >
            {isSubmitting.value ? "Adding..." : "Add Todo"}
          </button>
        </form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Admin Dashboard - Todos",
};
