'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/components/HomePage';

export default function Home() {
  const [filters, setFilters] = useState({
    sport: '',
    distance: '',
    difficulty: '',
    location: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div id="app">
      <Header 
        filters={filters}
        searchQuery={searchQuery}
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
      />
      
      <main className="main-content">
        <HomePage 
          filters={filters} 
          searchQuery={searchQuery}
        />
      </main>
      
      <Footer />
    </div>
  );
}
