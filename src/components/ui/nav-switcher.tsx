import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type NavOption = "following" | "explore" | "shop";

interface NavSwitcherProps {
  defaultValue?: NavOption;
}

const navOptions: { value: NavOption; label: string; path: string }[] = [
  { value: "following", label: "Following", path: "/" },
  { value: "explore", label: "Explore", path: "/explore" },
  { value: "shop", label: "Shop", path: "/shop" },
];

export function NavSwitcher({ defaultValue = "following" }: NavSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveValue = (): NavOption => {
    const option = navOptions.find(opt => opt.path === location.pathname);
    return option?.value || defaultValue;
  };

  const activeValue = getActiveValue();

  const handleChange = (newValue: NavOption) => {
    const option = navOptions.find(opt => opt.value === newValue);
    if (option) {
      navigate(option.path);
    }
  };

  return (
    <fieldset className="nav-switcher">
      <legend className="sr-only">Navigation</legend>
      {navOptions.map((option) => (
        <label key={option.value} className="nav-switcher__option">
          <input
            className="nav-switcher__input"
            type="radio"
            name="navigation"
            value={option.value}
            checked={activeValue === option.value}
            onChange={() => handleChange(option.value)}
          />
          <span className="nav-switcher__label">{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
