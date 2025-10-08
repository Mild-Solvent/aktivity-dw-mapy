'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  filters: {
    sport: string;
    distance: string;
    difficulty: string;
    location: string;
  };
  searchQuery: string;
  onFiltersChange: (filters: { sport: string; distance: string; difficulty: string; location: string }) => void;
  onSearchChange: (query: string) => void;
}

export default function Header({
  filters,
  searchQuery,
  onFiltersChange,
  onSearchChange,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // Focus the input when expanded
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  };

  const collapseSearch = () => {
    setIsSearchExpanded(false);
  };

  const handleGlobalClick = (event: MouseEvent) => {
    // Close menu if clicking outside of burger menu area
    if (isMenuOpen && !burgerMenuRef.current?.contains(event.target as Node)) {
      closeMenu();
    }
    
    // Collapse search if clicking outside of search container on mobile
    if (isSearchExpanded && !searchContainerRef.current?.contains(event.target as Node)) {
      collapseSearch();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen, isSearchExpanded]);

  // Close menu when route changes
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  const applyFilters = (filterType: string, value: string) => {
    onFiltersChange({
      ...filters,
      [filterType]: value,
    });
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Burger Menu */}
          <div className="burger-menu" ref={burgerMenuRef}>
            <button 
              className={`burger-button ${isMenuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            
            <nav className={`menu ${isMenuOpen ? 'open' : ''}`}>
              <div className="menu-content">
                <div className="menu-main">
                  <Link href="/" onClick={closeMenu} className={`menu-item ${pathname === '/' ? 'active' : ''}`}>
                    🏠 Domov
                  </Link>
                  <Link href="/terms" onClick={closeMenu} className={`menu-item ${pathname === '/terms' ? 'active' : ''}`}>
                    📋 Všeobecné podmienky
                  </Link>
                  <Link href="/privacy" onClick={closeMenu} className={`menu-item ${pathname === '/privacy' ? 'active' : ''}`}>
                    🔒 Ochrana súkromia
                  </Link>
                </div>
                
                {/* Filters (only show on home page) */}
                {pathname === '/' && (
                  <div className="filters">
                    <h3>Filtre</h3>
                    <div className="filter-group">
                      <label>Šport</label>
                      <select 
                        value={filters.sport} 
                        onChange={(e) => applyFilters('sport', e.target.value)}
                      >
                        <option value="">Všetky športy</option>
                        <option value="cycling">🚴 Cyklistika</option>
                        <option value="running">🏃 Beh</option>
                        <option value="hiking">🥾 Turistika</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Vzdialenosť</label>
                      <select 
                        value={filters.distance} 
                        onChange={(e) => applyFilters('distance', e.target.value)}
                      >
                        <option value="">Akákoľvek vzdialenosť</option>
                        <option value="short">&lt; 10 km</option>
                        <option value="medium">10–20 km</option>
                        <option value="long">&gt; 20 km</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>Náročnosť</label>
                      <select 
                        value={filters.difficulty} 
                        onChange={(e) => applyFilters('difficulty', e.target.value)}
                      >
                        <option value="">Akákoľvek náročnosť</option>
                        <option value="easy">🟢 Ľahká</option>
                        <option value="moderate">🟡 Stredná</option>
                        <option value="hard">🔴 Ťažká</option>
                      </select>
                    </div>
                    
                    <div className="filter-group">
                      <label>START</label>
                      <select 
                        value={filters.location} 
                        onChange={(e) => applyFilters('location', e.target.value)}
                      >
                        <option value="">Akákoľvek lokalita</option>
                        <option value="slovakia">🇸🇰 Slovensko</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Logo */}
          <div className={`logo ${isSearchExpanded ? 'logo-hidden' : ''}`}>
            <Link href="/" className="logo-link">
              🏃 ACTIVITY DW Club
            </Link>
          </div>

          {/* Search Bar */}
          <div 
            className={`search-container ${isSearchExpanded ? 'search-expanded' : ''}`}
            ref={searchContainerRef}
          >
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              type="text"
              placeholder="Hľadať trasy..."
              className="search-input"
              ref={searchInputRef}
            />
            <button 
              className={`search-icon ${isSearchExpanded ? 'search-icon-active' : ''}`}
              onClick={toggleSearch}
            >
              🔍
            </button>
          </div>
        </div>
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && <div className="menu-overlay"></div>}
    </>
  );
}