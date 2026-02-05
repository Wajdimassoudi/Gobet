
import React, { useContext, useState } from 'react';
import { Role } from '../types';
import { AuthContext } from '../App';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const UserNavItems = ['Sports', 'Casino', 'Slots', 'Live Casino'];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const auth = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  const navItems = auth?.user?.role === Role.ADMIN ? ['Admin', ...UserNavItems] : UserNavItems;

  const NavLinks = () => (
    <nav>
      <ul>
        {navItems.map((item) => (
          <li key={item}>
            <button
              onClick={() => {
                setActiveView(item);
                setIsOpen(false);
              }}
              className={`w-full text-left p-4 font-semibold transition duration-200 ${
                activeView === item
                  ? 'bg-brand-primary text-brand-background'
                  : 'text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary'
              }`}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile Header and Hamburger */}
      <div className="md:hidden bg-brand-surface p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-primary">GoBet</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
        </button>
      </div>
      
      {/* Mobile Sliding Menu */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 bg-gray-800 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
         <div className="p-4 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-brand-primary">GoBet</h1>
         </div>
        <NavLinks />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-black/50 border-r border-gray-700 min-h-screen">
        <div className="p-6 text-center border-b border-gray-700">
          <h1 className="text-3xl font-bold text-brand-primary">GoBet</h1>
        </div>
        <NavLinks />
      </aside>
    </>
  );
};

export default Sidebar;
