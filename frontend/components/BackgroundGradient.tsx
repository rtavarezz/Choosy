/** Background gradient component for consistent styling across pages */
export function BackgroundGradient() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(124,58,237,0.35),transparent_60%),radial-gradient(900px_500px_at_110%_20%,rgba(37,99,235,0.25),transparent_60%),linear-gradient(180deg,#0B1020_0%,#0B1C3A_100%)] dark:bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(124,58,237,0.25),transparent_60%),radial-gradient(900px_500px_at_110%_20%,rgba(37,99,235,0.2),transparent_60%),linear-gradient(180deg,#05080F_0%,#0A0F1F_100%)]" />
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%224%22><rect width=%224%22 height=%224%22 fill=%22%23fff%22 opacity=%220.6%22/></svg>')" }} />
    </div>
  );
}