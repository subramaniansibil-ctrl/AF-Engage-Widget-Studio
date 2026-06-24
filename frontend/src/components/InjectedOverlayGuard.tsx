import { useEffect } from 'react';

const injectedOverlaySelectors = [
  '#codex-browser-sidebar-comments-root',
  '[id^="codex-browser-sidebar-comments"]',
];

function removeInjectedOverlays() {
  injectedOverlaySelectors.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.remove();
    });
  });
}

export function InjectedOverlayGuard() {
  useEffect(() => {
    removeInjectedOverlays();

    const observer = new MutationObserver(removeInjectedOverlays);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
