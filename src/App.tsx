import { useEffect, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { OverlayHost } from "./components/OverlayHost";
import { PageHost } from "./components/PageHost";
import { mountLegacyApp } from "./legacy/runtime";

export default function App() {
  const [activePage, setActivePage] = useState("analytics");

  useEffect(() => {
    const handlePageChange = (event: Event) => {
      const page = (event as CustomEvent<string>).detail;
      if (page) setActivePage(page);
    };
    window.addEventListener("stride:page-change", handlePageChange);
    void mountLegacyApp();
    return () => window.removeEventListener("stride:page-change", handlePageChange);
  }, []);

  return <><AppHeader activePage={activePage} /><PageHost /><OverlayHost /></>;
}
