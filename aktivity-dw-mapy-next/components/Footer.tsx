'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-links">
            <Link href="/" className={`footer-link ${pathname === '/' ? 'active' : ''}`}>
              🏠 Domov
            </Link>
            <Link href="/terms" className={`footer-link ${pathname === '/terms' ? 'active' : ''}`}>
              📋 Všeobecné podmienky
            </Link>
            <Link href="/privacy" className={`footer-link ${pathname === '/privacy' ? 'active' : ''}`}>
              🔒 Ochrana súkromia
            </Link>
          </div>
          
          <div className="footer-info">
            <div className="copyright">
              Vytvorené v spolupráci s <a href="https://new.ceaeurope.sk/" target="_blank" rel="noopener" className="support-link">ceaeurope.sk</a>
            </div>
            <div className="developer">
              Development a design od <a href="https://mild-solvent.github.io/Portfolio/" target="_blank" rel="noopener" className="developer-link">Mild Solvent</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}