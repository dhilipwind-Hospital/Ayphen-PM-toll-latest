/**
 * Typography Components
 * Reusable, styled text components for consistent typography across the app
 */

import styled from 'styled-components';
import { textStyles, typography } from '../../theme/typography';

// ============================================
// DISPLAY HEADINGS (Hero sections)
// ============================================

export const DisplayLarge = styled.h1`
  font-size: ${textStyles.displayLarge.fontSize};
  font-weight: ${textStyles.displayLarge.fontWeight};
  line-height: ${textStyles.displayLarge.lineHeight};
  letter-spacing: ${textStyles.displayLarge.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

export const DisplayMedium = styled.h1`
  font-size: ${textStyles.displayMedium.fontSize};
  font-weight: ${textStyles.displayMedium.fontWeight};
  line-height: ${textStyles.displayMedium.lineHeight};
  letter-spacing: ${textStyles.displayMedium.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

// ============================================
// HEADINGS
// ============================================

export const H1 = styled.h1`
  font-size: ${textStyles.h1.fontSize};
  font-weight: ${textStyles.h1.fontWeight};
  line-height: ${textStyles.h1.lineHeight};
  letter-spacing: ${textStyles.h1.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

export const H2 = styled.h2`
  font-size: ${textStyles.h2.fontSize};
  font-weight: ${textStyles.h2.fontWeight};
  line-height: ${textStyles.h2.lineHeight};
  letter-spacing: ${textStyles.h2.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

export const H3 = styled.h3`
  font-size: ${textStyles.h3.fontSize};
  font-weight: ${textStyles.h3.fontWeight};
  line-height: ${textStyles.h3.lineHeight};
  letter-spacing: ${textStyles.h3.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

export const H4 = styled.h4`
  font-size: ${textStyles.h4.fontSize};
  font-weight: ${textStyles.h4.fontWeight};
  line-height: ${textStyles.h4.lineHeight};
  letter-spacing: ${textStyles.h4.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

export const H5 = styled.h5`
  font-size: ${textStyles.h5.fontSize};
  font-weight: ${textStyles.h5.fontWeight};
  line-height: ${textStyles.h5.lineHeight};
  letter-spacing: ${textStyles.h5.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

export const H6 = styled.h6`
  font-size: ${textStyles.h6.fontSize};
  font-weight: ${textStyles.h6.fontWeight};
  line-height: ${textStyles.h6.lineHeight};
  letter-spacing: ${textStyles.h6.letterSpacing};
  color: var(--color-text-primary);
  margin: 0;
`;

// ============================================
// BODY TEXT
// ============================================

export const BodyLarge = styled.p`
  font-size: ${textStyles.bodyLarge.fontSize};
  font-weight: ${textStyles.bodyLarge.fontWeight};
  line-height: ${textStyles.bodyLarge.lineHeight};
  letter-spacing: ${textStyles.bodyLarge.letterSpacing};
  color: var(--color-text-secondary);
  margin: 0;
`;

export const Body = styled.p`
  font-size: ${textStyles.body.fontSize};
  font-weight: ${textStyles.body.fontWeight};
  line-height: ${textStyles.body.lineHeight};
  letter-spacing: ${textStyles.body.letterSpacing};
  color: var(--color-text-secondary);
  margin: 0;
`;

export const BodySmall = styled.p`
  font-size: ${textStyles.bodySmall.fontSize};
  font-weight: ${textStyles.bodySmall.fontWeight};
  line-height: ${textStyles.bodySmall.lineHeight};
  letter-spacing: ${textStyles.bodySmall.letterSpacing};
  color: var(--color-text-secondary);
  margin: 0;
`;

// ============================================
// SPECIAL TEXT
// ============================================

export const Label = styled.span`
  font-size: ${textStyles.label.fontSize};
  font-weight: ${textStyles.label.fontWeight};
  line-height: ${textStyles.label.lineHeight};
  letter-spacing: ${textStyles.label.letterSpacing};
  text-transform: ${textStyles.label.textTransform};
  color: var(--color-text-secondary);
  display: inline-block;
`;

export const Caption = styled.span`
  font-size: ${textStyles.caption.fontSize};
  font-weight: ${textStyles.caption.fontWeight};
  line-height: ${textStyles.caption.lineHeight};
  letter-spacing: ${textStyles.caption.letterSpacing};
  color: var(--color-text-secondary);
  display: inline-block;
`;

export const Overline = styled.span`
  font-size: ${textStyles.overline.fontSize};
  font-weight: ${textStyles.overline.fontWeight};
  line-height: ${textStyles.overline.lineHeight};
  letter-spacing: ${textStyles.overline.letterSpacing};
  text-transform: ${textStyles.overline.textTransform};
  color: var(--color-text-secondary);
  display: inline-block;
`;

// ============================================
// INTERACTIVE TEXT
// ============================================

export const ButtonText = styled.span`
  font-size: ${textStyles.button.fontSize};
  font-weight: ${textStyles.button.fontWeight};
  line-height: ${textStyles.button.lineHeight};
  letter-spacing: ${textStyles.button.letterSpacing};
`;

export const Link = styled.a`
  font-size: ${textStyles.link.fontSize};
  font-weight: ${textStyles.link.fontWeight};
  line-height: ${textStyles.link.lineHeight};
  letter-spacing: ${textStyles.link.letterSpacing};
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

// ============================================
// CODE & MONO
// ============================================

export const Code = styled.code`
  font-family: ${typography.fontFamily.mono};
  font-size: ${textStyles.code.fontSize};
  font-weight: ${textStyles.code.fontWeight};
  line-height: ${textStyles.code.lineHeight};
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  color: #EC4899;
`;

export const CodeBlock = styled.pre`
  font-family: ${typography.fontFamily.mono};
  font-size: ${typography.fontSize.sm};
  line-height: ${typography.lineHeight.relaxed};
  background: #1F2937;
  color: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
  
  code {
    background: none;
    padding: 0;
    color: inherit;
  }
`;

// ============================================
// UTILITY COMPONENTS
// ============================================

// Text with gradient effect (for hero sections)
export const GradientText = styled.span`
  background: linear-gradient(135deg, #EC4899, #DB2777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

// Muted text (for less important info)
export const Muted = styled.span`
  color: #9CA3AF;
`;

// Strong emphasis
export const Strong = styled.strong`
  font-weight: ${typography.fontWeight.semibold};
  color: var(--color-text-primary);
`;

// Subtle emphasis
export const Em = styled.em`
  font-style: italic;
  color: var(--color-text-primary);
`;
