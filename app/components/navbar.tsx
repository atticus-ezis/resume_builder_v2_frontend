"use client";

import Link from "next/link";
import { api } from "@/app/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import {
  Navbar as FlowbiteNavbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  Button,
  Dropdown,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
  Avatar,
  ToggleSwitch,
} from "flowbite-react";

export default function Navbar() {
  const router = useRouter();
  const { isVerified } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { userEmail } = useAuth();

  async function logoutHandler() {
    await api.post("/api/accounts/logout/");
    router.push("/");
  }

  return (
    <FlowbiteNavbar fluid rounded className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <NavbarBrand as={Link} href="/account/generate">
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Resume Builder</span>
      </NavbarBrand>
      <div className="flex md:order-2 gap-2 items-center">
        {/* Dark Mode Toggle */}
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          <ToggleSwitch checked={theme === "dark"} onChange={toggleTheme} label="" aria-label="Toggle dark mode" />
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </div>

        {isVerified ? (
          <div>
            <Dropdown arrowIcon={false} inline label={<Avatar alt="User settings" img="" rounded></Avatar>}>
              <DropdownItem as={Link} href="/account/profile">
                Profile
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem onClick={logoutHandler}>Sign out</DropdownItem>
            </Dropdown>
          </div>
        ) : (
          <>
            <Button as={Link} href="/account/login" color="gray" outline>
              Login
            </Button>
            <Button as={Link} href="/account/register" color="blue">
              Sign up
            </Button>
          </>
        )}
        <NavbarToggle />
      </div>
    </FlowbiteNavbar>
  );
}
