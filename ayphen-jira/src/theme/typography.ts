/**
 * Typography System
 * Centralized font configuration for consistent text styling across the app
 */

export const typography = {
    // Font Families
    fontFamily: {
        base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
        mono: "'Fira Code', 'SF Mono', 'Monaco', 'Courier New', monospace",
    },

    // Font Sizes - Based on 16px base (1rem)
    fontSize: {
        xs: '0.75rem',      // 12px - Captions, labels
        sm: '0.875rem',     // 14px - Small text, metadata
        base: '1rem',       // 16px - Body text
        lg: '1.125rem',     // 18px - Large body, subtitles
        xl: '1.25rem',      // 20px - Small headings
        '2xl': '1.5rem',    // 24px - H3
        '3xl': '1.875rem',  // 30px - H2
        '4xl': '2.25rem',   // 36px - H1
        '5xl': '3rem',      // 48px - Display headings
        '6xl': '3.75rem',   // 60px - Hero headings
    },

    // Font Weights
    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },

    // Line Heights
    lineHeight: {
        none: 1,
        tight: 1.2,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
    },

    // Letter Spacing
    letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
};

// Pre-configured text styles for common use cases
export const textStyles = {
    // Display styles (Hero sections)
    displayLarge: {
        fontSize: typography.fontSize['6xl'],
        fontWeight: typography.fontWeight.extrabold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tighter,
    },
    displayMedium: {
        fontSize: typography.fontSize['5xl'],
        fontWeight: typography.fontWeight.extrabold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
    },

    // Heading styles
    h1: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.extrabold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
    },
    h2: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
    },
    h3: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.normal,
    },
    h4: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.normal,
    },
    h5: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
    },
    h6: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
    },

    // Body text
    bodyLarge: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.relaxed,
        letterSpacing: typography.letterSpacing.normal,
    },
    body: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
    },
    bodySmall: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
    },

    // Special text
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.wider,
        textTransform: 'uppercase' as const,
    },
    caption: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
    },
    overline: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.widest,
        textTransform: 'uppercase' as const,
    },

    // Interactive text
    button: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.none,
        letterSpacing: typography.letterSpacing.wide,
    },
    link: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.normal,
    },

    // Code
    code: {
        fontFamily: typography.fontFamily.mono,
        fontSize: '0.9em',
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
    },
};

export default typography;
