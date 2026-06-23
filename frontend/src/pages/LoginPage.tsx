import { motion } from 'framer-motion';

export function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-6 text-ink">
      <motion.section
        className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-8 shadow-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <p className="text-sm font-semibold text-sage">AF Engage</p>
        <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Login placeholder for advisor and client authentication.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          Continue
        </button>
      </motion.section>
    </main>
  );
}
