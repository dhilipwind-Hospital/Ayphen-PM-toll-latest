/**
 * Typography Components - Export Barrel
 * 
 * Usage:
 * import { H1, Body, Label } from '@/components/Typography';
 */

export {
    // Display headings
    DisplayLarge,
    DisplayMedium,

    // Headings
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,

    // Body text
    BodyLarge,
    Body,
    BodySmall,

    // Special text
    Label,
    Caption,
    Overline,

    // Interactive
    ButtonText,
    Link,

    // Code
    Code,
    CodeBlock,

    // Utilities
    GradientText,
    Muted,
    Strong,
    Em,
} from './Text';

// Re-export typography theme for convenience
export { typography, textStyles } from '../../theme/typography';
