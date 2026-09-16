import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#E2E8F0] bg-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <p>© {new Date().getFullYear()} JarbTeam. Built for university student collaboration.</p>
        <div className="flex items-center gap-6">
          <span>Find your next project. Build it with the right people.</span>
        </div>
      </div>
    </footer>
  );
}
