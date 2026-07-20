export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <span className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Phase 1 · Development scaffold
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Socra</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-300">
        A Socratic tutoring platform. Socra guides students through progressive
        questions and hints instead of giving final answers, powered by a
        self-hosted, fine-tuned Gemma 4 model.
      </p>
      <div className="text-sm text-zinc-500">
        Frontend is running. Start the backend at{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-zinc-800">
          http://localhost:8000
        </code>
        .
      </div>
    </main>
  );
}
