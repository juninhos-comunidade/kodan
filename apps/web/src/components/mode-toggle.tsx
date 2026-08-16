"use client";

import { Button } from "@kodan/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kodan/ui/components/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import * as React from "react";

import { useTheme } from "./theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <Sun className="size-[1.2rem] rotate-0 scale-100 opacity-100 transition-[transform,opacity] dark:-rotate-90 dark:scale-95 dark:opacity-0" />
        <Moon className="absolute size-[1.2rem] rotate-90 scale-95 opacity-0 transition-[transform,opacity] dark:rotate-0 dark:scale-100 dark:opacity-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
