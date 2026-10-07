import { component$, useSignal, useResource$, Resource } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  experience,
  profile,
  projects,
  skills,
} from "~/data/profile";

type Todo = {
  id: string;
  text: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
};

export default component$(() => {
  const menuOpen = useSignal(false);

  const todosResource = useResource$<Todo[]>(async () => {
    // NOTE: Update this URL to your deployed Worker URL in production
    const response = await fetch("https://backend.atrikumar31.workers.dev/api/todos");
    if (!response.ok) throw new Error("Failed to fetch todos");
    return response.json();
  });

  return (
    <>
      <a class="skip" href="#work">
        Skip to work
      </a>

      <header class="nav">
        <a class="mark" href="#top" aria-label="Arjun Dubey, home">
          {profile.initials}
        </a>
        <button
          class="menu-btn"
          type="button"
          aria-expanded={menuOpen.value}
          aria-controls="site-nav"
          onClick$={() => {
            menuOpen.value = !menuOpen.value;
          }}
        >
          {menuOpen.value ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" class={menuOpen.value ? "open" : ""}>
          <a href="#about" onClick$={() => (menuOpen.value = false)}>
            About
          </a>
          <a href="#work" onClick$={() => (menuOpen.value = false)}>
            Work
          </a>
          <a href="#path" onClick$={() => (menuOpen.value = false)}>
            Path
          </a>
          <a href="#todos" onClick$={() => (menuOpen.value = false)}>
            Now
          </a>
          <a href="#contact" onClick$={() => (menuOpen.value = false)}>
            Contact
          </a>
        </nav>
      </header>

      <main id="top">
        <section class="hero">
          <p class="eyebrow">
            <span>{profile.availability}</span>
            <span class="dot" aria-hidden="true" />
            <span>{profile.location}</span>
          </p>
          <h1>
            <span class="name">{profile.name}</span>
            <span class="role">{profile.role}</span>
          </h1>
          <p class="lede">{profile.tagline}</p>
          <div class="hero-actions">
            <a class="btn" href="#work">
              Selected work
            </a>
            <a class="btn ghost" href="#contact">
              Get in touch
            </a>
          </div>
        </section>

        <section id="about" class="band">
          <p class="kicker">About</p>
          <div class="split">
            <div>
              {profile.about.map((paragraph) => (
                <p key={paragraph} class="prose">
                  {paragraph}
                </p>
              ))}
            </div>
            <ul class="skill-list">
              {skills.map((group) => (
                <li key={group.group}>
                  <span>{group.group}</span>
                  <strong>{group.items.join(" · ")}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="work" class="band">
          <p class="kicker">Selected work</p>
          <ol class="projects">
            {projects.map((project) => (
              <li key={project.title}>
                <a href={project.href}>
                  <span class="year">{project.year}</span>
                  <span class="project-copy">
                    <strong>{project.title}</strong>
                    <span>{project.summary}</span>
                  </span>
                  <span class="tags">{project.tags.join(" / ")}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section id="path" class="band">
          <p class="kicker">Path</p>
          <ol class="timeline">
            {experience.map((item) => (
              <li key={item.period}>
                <span>{item.period}</span>
                <div>
                  <strong>
                    {item.role}, {item.place}
                  </strong>
                  <p>{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="todos" class="band">
          <p class="kicker">Current Focus</p>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 500,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              margin: "0",
            }}
          >
            What I'm Working On
          </h2>

          <Resource
            value={todosResource}
            onPending={() => <p style={{ color: "var(--muted)" }}>Loading status...</p>}
            onRejected={() => <p style={{ color: "var(--muted)" }}>Status currently unavailable.</p>}
            onResolved={(todos) =>
              todos.length === 0 ? (
                <p style={{ color: "var(--muted)", marginTop: "2rem" }}>Nothing listed yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, marginTop: "2rem" }}>
                  {todos.map((todo) => (
                    <li
                      key={todo.id}
                      style={{
                        padding: "1rem 0",
                        borderBottom: "1px solid var(--line)",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor:
                            todo.status === "completed"
                              ? "#10b981"
                              : todo.status === "in_progress"
                                ? "#f59e0b"
                                : "#6b7280",
                          boxShadow: todo.status === "in_progress" ? "0 0 8px #f59e0b" : "none",
                        }}
                        title={todo.status.replace("_", " ")}
                      />
                      <span
                        style={{
                          textDecoration: todo.status === "completed" ? "line-through" : "none",
                          color: todo.status === "completed" ? "var(--muted)" : "var(--ink)",
                          fontSize: "1.1rem",
                        }}
                      >
                        {todo.text}
                      </span>
                      {todo.status === "in_progress" && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--accent)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )
            }
          />
        </section>

        <section id="contact" class="band close">
          <p class="kicker">Contact</p>
          <h2>Say hello.</h2>
          <p class="lede">{profile.intro}</p>
          <ul class="links">
            {profile.links.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer>
        <span>{profile.name}</span>
        <span>Built with Qwik</span>
      </footer>
    </>
  );
});

export const head: DocumentHead = {
  title: "Arjun Dubey — Software Engineer",
  meta: [
    {
      name: "description",
      content:
        "Portfolio of Arjun Dubey, a software engineer building fast interfaces and the systems behind them.",
    },
  ],
};
