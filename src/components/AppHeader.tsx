const navigation = [
  ["analytics", "Analyse"],
  ["plan", "Plan"],
  ["overview", "Course"],
  ["strength", "Fitness"],
  ["cut", "Alimentation"],
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    overview: "M3 16l5-6 4 4 8-10M3 21h18",
    plan: "M4 5h16v16H4zM8 3v4m8-4v4M4 10h16",
    analytics: "M4 20V10m8 10V4m8 16v-7",
    strength: "M3 8v8m3-10v12m12-12v12m3-10v8M6 12h12",
    cut: "M12 3c4 5 7 8 7 12a7 7 0 01-14 0c0-4 3-7 7-12z",
  };
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.overview} /></svg>;
}

export function AppHeader({ activePage }: { activePage: string }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <button className="brand-logo" data-action="nav" data-page="analytics" aria-label="Accueil Stride">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M4 25L16 7h8L12 25H4zm12 0 8-12h5l-8 12h-5z" fill="currentColor" /></svg>
          stride.
        </button>
        <nav className="app-nav" aria-label="Navigation principale">
          {navigation.map(([id, label]) => (
            <button key={id} className={activePage === id ? "active" : ""} data-action="nav" data-page={id} aria-current={activePage === id ? "page" : undefined}>
              <span className="nav-icon"><Icon name={id} /></span><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <span className="header-status"><span className="dot" />COROS</span>
          <button className="header-icon" data-action="theme" aria-label="Changer le thème">☾</button>
          <button className="header-icon" data-action="export" aria-label="Exporter ma sauvegarde">↓</button>
          <span className="header-avatar" aria-hidden="true">GO</span>
        </div>
      </div>
    </header>
  );
}
