
import React, { ReactNode } from 'react';
import { User, Role } from '../types';
import { LayoutDashboard, ShoppingCart, Package, HardDrive, LogOut, Menu, MessageCircle, ChefHat, BookOpen } from 'lucide-react';

interface LayoutProps {
  currentUser: User;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, currentView, onChangeView, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label, roles }: { view: string, icon: any, label: string, roles: Role[] }) => {
    if (!roles.includes(currentUser.role)) return null;
    
    const isActive = currentView === view;
    return (
      <button
        onClick={() => {
            onChangeView(view);
            setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-200' 
            : 'text-gray-600 hover:bg-coffee-50 hover:text-coffee-700'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-current'}`} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-4 h-full">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-8 h-8 bg-coffee-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">DM</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-none text-base">Dulce Mimo</h1>
            <span className="text-[10px] text-coffee-600 font-normal block">Café & Alfajores</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" roles={[Role.ADMIN]} />
          <NavItem view="pos" icon={ShoppingCart} label="Punto de Venta" roles={[Role.ADMIN, Role.CAJERO]} />
          <NavItem view="menu_manager" icon={BookOpen} label="Menú Cafetería" roles={[Role.ADMIN, Role.ALMACEN]} />
          <NavItem view="kitchen" icon={ChefHat} label="Pedidos de Mesa" roles={[Role.ADMIN, Role.CAJERO]} />
          <NavItem view="whatsapp" icon={MessageCircle} label="Pedidos WA" roles={[Role.ADMIN, Role.CAJERO, Role.ALMACEN]} />
          <NavItem view="inventory" icon={Package} label="Inventario" roles={[Role.ADMIN, Role.ALMACEN, Role.CAJERO]} />
          <NavItem view="assets" icon={HardDrive} label="Activos Fijos" roles={[Role.ADMIN, Role.ALMACEN]} />
        </nav>

        <div className="border-t border-gray-100 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center z-20">
            <div className="flex flex-col">
                <div className="font-bold text-coffee-800 text-base">Dulce Mimo</div>
                <div className="text-[10px] text-coffee-600">Café & Alfajores</div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6 text-gray-700" />
            </button>
        </header>
        
        {isMobileMenuOpen && (
             <div className="md:hidden absolute inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-4 flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
                    <nav className="flex-1 space-y-2 mt-12">
                        <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" roles={[Role.ADMIN]} />
                        <NavItem view="pos" icon={ShoppingCart} label="Ventas" roles={[Role.ADMIN, Role.CAJERO]} />
                        <NavItem view="menu_manager" icon={BookOpen} label="Menú Cafetería" roles={[Role.ADMIN, Role.ALMACEN]} />
                        <NavItem view="kitchen" icon={ChefHat} label="Pedidos de Mesa" roles={[Role.ADMIN, Role.CAJERO]} />
                        <NavItem view="whatsapp" icon={MessageCircle} label="Pedidos WA" roles={[Role.ADMIN, Role.CAJERO, Role.ALMACEN]} />
                        <NavItem view="inventory" icon={Package} label="Inventario" roles={[Role.ADMIN, Role.ALMACEN, Role.CAJERO]} />
                        <NavItem view="assets" icon={HardDrive} label="Activos" roles={[Role.ADMIN, Role.ALMACEN]} />
                    </nav>
                    <button onClick={onLogout} className="mt-auto flex items-center gap-2 text-red-600 p-4 font-bold border-t">
                        <LogOut className="w-4 h-4" /> Salir
                    </button>
                </div>
             </div>
        )}

        <main className="flex-1 relative overflow-hidden">
            {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
