
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './navbar.css';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const navRef = useRef(null);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the active-page indicator aligned with the selected link.
  useEffect(() => {
    const nav = navRef.current?.querySelector('ul');

    if (!nav) return;

   const updateSelector = () => {
  const activeItem = nav.querySelector('li.nav-item.active');
  const selector = nav.querySelector('.hori-selector');

  if (!activeItem || !selector) {
    if (selector) selector.style.opacity = '0';
    return;
  }

  const navRect = nav.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();

  selector.style.opacity = '1';
  selector.style.top = `${itemRect.top - navRect.top + nav.scrollTop}px`;
  selector.style.left = `${itemRect.left - navRect.left + nav.scrollLeft}px`;
  selector.style.width = `${itemRect.width}px`;
  selector.style.height = `${itemRect.height}px`;
};
    const frame = requestAnimationFrame(updateSelector);
    window.addEventListener('resize', updateSelector);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateSelector);
    };
  }, [pathname, menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-custom navbar-mainbg">
      <div className="logo">
        <Image
          src={logo}
          alt="TechNeeds Logo"
          width={80}
          height={80}
        />
      </div>

      <button
        className="navbar-toggler"
        type="button"
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-controls="navbarSupportedContent"
        aria-expanded={menuOpen}
        aria-label="Toggle navigation"
      >
        <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'} text-white`}></i>
      </button>

      <div
        className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}
        id="navbarSupportedContent"
        ref={navRef}
      >
        <ul className="navbar-nav ml-auto">
          <li className="hori-selector" aria-hidden="true"></li>

          <li className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
            <Link className="nav-link" href="/" onClick={closeMenu}>
              <i className="fas fa-home"></i> Home
            </Link>
          </li>

          <li className={`nav-item ${pathname === '/techboard' ? 'active' : ''}`}>
            <Link className="nav-link" href="/techboard" onClick={closeMenu}>
              <i className="fas fa-microchip"></i> Techboard
            </Link>
          </li>

          <li className={`nav-item ${pathname === '/team' ? 'active' : ''}`}>
            <Link className="nav-link" href="/team" onClick={closeMenu}>
              <i className="fas fa-users"></i> Team
            </Link>
          </li>

          <li className={`nav-item ${pathname === '/leaderboard' ? 'active' : ''}`}>
            <Link className="nav-link" href="/leaderboard" onClick={closeMenu}>
              <i className="fa-solid fa-ranking-star"></i> Leaderboard
            </Link>
          </li>

          <li className={`nav-item ${pathname === '/faq' ? 'active' : ''}`}>
            <Link className="nav-link" href="/faq" onClick={closeMenu}>
              <i className="fas fa-question-circle"></i> FAQs
            </Link>
          </li>

          <li className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}>
            <Link className="nav-link" href="/profile" onClick={closeMenu}>
              <i className="fas fa-user-circle"></i> Profile
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
