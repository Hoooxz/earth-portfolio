'use client';

import { useState } from 'react';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export default function Navigation() {
  const [active, setActive] = useState('Home');

  return (
    <nav className="nav">
      <div className="nav-logo">PORTFOLIO</div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              onClick={() => setActive(item.label)}
              style={{
                color: active === item.label ? '#00d4ff' : 'inherit',
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
