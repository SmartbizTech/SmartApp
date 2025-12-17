import React, { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Drawer from "devextreme-react/drawer";
import { UserPanel } from "./UserPanel";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const getNavItems = () => {
    if (user?.role === "SUPER_ADMIN") {
      return [{ id: "/admin", text: "Admin", icon: "admin" }];
    }

    if (user?.role === "CLIENT") {
      return [
        { id: "/dashboard", text: "Dashboard", icon: "home" },
        { id: "/documents", text: "Documents", icon: "file" },
        { id: "/tasks", text: "Tasks", icon: "checklist" },
        { id: "/calendar", text: "Calendar", icon: "event" },
        { id: "/chat", text: "Messages", icon: "message" },
      ];
    }

    const items = [
      { id: "/dashboard", text: "Dashboard", icon: "home" },
      { id: "/clients", text: "Clients", icon: "group" },
      { id: "/documents", text: "Documents", icon: "file" },
      { id: "/tasks", text: "Tasks", icon: "checklist" },
      { id: "/calendar", text: "Calendar", icon: "event" },
      { id: "/chat", text: "Messages", icon: "message" },
    ];
    if (user?.role === "CA_ADMIN") {
      items.splice(2, 0, { id: "/team", text: "Team", icon: "user" });
    }
    return items;
  };

  const menuItems = getNavItems() || [];

  return (
    <div className="dx-layout">
      <header className="app-header">
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          ☰
        </button>
        <div
          className="app-title"
          onClick={() =>
            navigate(user?.role === "SUPER_ADMIN" ? "/admin" : "/dashboard")
          }
        >
          CA Portal
        </div>
        <UserPanel user={user} onLogout={logout} />
      </header>

      <Drawer
        opened={drawerOpen}
        openedStateMode="overlap"
        position="before"
        revealMode="slide"
        height="100%"
        closeOnOutsideClick={true}
        onOpenedChange={setDrawerOpen}
        render={() => (
          <nav className="side-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`side-nav-item ${isActive(item.id) ? "active" : ""}`}
                onClick={() => {
                  navigate(item.id);
                  setDrawerOpen(false);
                }}
              >
                <span className={`dx-icon dx-icon-${item.icon}`} />
                <span>{item.text}</span>
              </button>
            ))}
          </nav>
        )}
      >
        <div className="dx-drawer-content">{children}</div>
      </Drawer>
    </div>
  );
};
