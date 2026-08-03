import type { Preview } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { ThemeProvider, useTheme } from "../src/components/theme-provider";
import { SessionProvider } from "../src/providers/session-provider";
import "../src/index.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Tema",
      description: "Tema visual do Kodan",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => (
      <SessionProvider session={null}>
        <ThemeProvider>
          <ThemeSync theme={context.globals.theme === "dark" ? "dark" : "light"} />
          <div className="bg-background text-foreground transition-colors duration-200">
            <Story />
          </div>
        </ThemeProvider>
      </SessionProvider>
    ),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
    a11y: { test: "todo" },
    nextjs: { appDirectory: true, navigation: { pathname: "/inicio" } },
  },
  tags: ["autodocs"],
};

function ThemeSync({ theme }: { theme: "light" | "dark" }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
    document.documentElement.style.colorScheme = theme;
  }, [setTheme, theme]);

  return null;
}

export default preview;
