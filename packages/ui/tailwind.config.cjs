/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [], // Consuming app must add content paths
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // Existing shadcn/ui colors (HSL-based)
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },

                // Theme-aware semantic colors (RGB-based for alpha support)
                surface: {
                    DEFAULT: "rgb(var(--surface-primary) / <alpha-value>)",
                    secondary: "rgb(var(--surface-secondary) / <alpha-value>)",
                    tertiary: "rgb(var(--surface-tertiary) / <alpha-value>)",
                    elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
                },
                content: {
                    DEFAULT: "rgb(var(--content-primary) / <alpha-value>)",
                    secondary: "rgb(var(--content-secondary) / <alpha-value>)",
                    muted: "rgb(var(--content-muted) / <alpha-value>)",
                },
                edge: {
                    DEFAULT: "rgb(var(--edge-primary) / <alpha-value>)",
                    secondary: "rgb(var(--edge-secondary) / <alpha-value>)",
                },
                interactive: {
                    hover: "rgb(var(--interactive-hover) / <alpha-value>)",
                    active: "rgb(var(--interactive-active) / <alpha-value>)",
                },
                brand: {
                    DEFAULT: "rgb(var(--accent) / <alpha-value>)",
                    hover: "rgb(var(--accent-hover) / <alpha-value>)",
                    foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
                },
                status: {
                    pass: "rgb(var(--status-pass) / <alpha-value>)",
                    fail: "rgb(var(--status-fail) / <alpha-value>)",
                    warning: "rgb(var(--status-warning) / <alpha-value>)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
