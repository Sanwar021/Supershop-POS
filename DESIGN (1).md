# Order groceries from USA Super Mart in Dhaka

## Overview

**Product:** Order groceries from USA Super Mart in Dhaka
**URL:** https://www.foodpanda.com.bd/shop/nfvk/usa-super-mart-nfvk
**Surface type:** e-commerce
**Audience:** Consumers and shoppers
**Brand character:** Product-focused shopping experience with a rich, diverse color palette and a complementary two-font typographic system.

### Design Principles

- Trust signals first — credibility reduces friction more than clever copy.
- Clear path to action — one primary CTA per view, never stacked.
- Speed over polish — perceived performance is part of the design system.

## Colors

| Token | Value | Role |
|-------|-------|------|
| --colorTagPrimaryBg | `#E21B70` | Background |
| --colorGenericBg | `#FFDDDD` | Background |
| --colorExp2GenericBg | `#FFEBEB` | Background |
| --colorTagDietarySpicyBackground | `#FDEFEB` | Background |
| --colorProDealHighlight4 | `#5C1D94` | Text Primary |
| --colorJokerPrimary | `#1F4D5D` | Text Primary |
| --colorInformation | `#25537C` | Text Primary |
| --colorLinearGradient2 | `#A11350` | Text Primary |
| --colorProGradientStart | `#6E3DAB` | Text Primary |
| --colorYuuPrimary | `#307FE2` | Text Primary |
| --colorJokerPrimaryBk2 | `#B9C0C6` | Text Primary |
| --colorJokerPrimaryBk | `#E3E6E8` | Text Primary |
| --colorSgroupPrimary | `#FFFFFF` | Text Primary |
| --colorOnInteractionSecondary | `#2E3138` | Text Secondary |
| --colorInteractionSecondaryInactive | `#6B7175` | Text Secondary |
| --colorBrandSecondary | `#6B7680` | Text Secondary |
| --colorJokerSecondary | `#FF2B85` | Text Secondary |
| --colorDealSecondary | `#F77C99` | Text Secondary |
| --colorJokerSecondaryBk | `#FAD9E7` | Text Secondary |
| --colorTagDietarySpicy | `#BB2800` | Accent |

_Showing 20 of 46 detected colors. Full palette available in the extension._

## Typography

**Font stack:** PP Agrandir, Open Sans

| Level | Size | Usage |
|-------|------|-------|
| text-xs | 12px | Captions, metadata |
| text-sm | 14px | Labels, secondary text |
| text-base | 16px | Body text (default) |
| text-lg | 24px | Subheadings, emphasis |

**Weight scale:** 300 · 400 · 600 · 700 · 900
**Line heights:** 24px · 36px · 22px · 0px · 20px · 46px · 25.6px · 16px · 18px

## Spacing

**Base unit:** 8px

`space-1: 4px` · `space-2: 8px` · `space-3: 12px` · `space-4: 15px` · `space-5: 16px` · `space-6: 24px` · `space-7: 144px`

## Shapes

**Border radius:** `radius-sm: 4px` · `radius-md: 8px` · `radius-lg: 12px` · `radius-full: 9999px`

## Elevation

- **shadow-sm:** `rgba(0, 0, 0, 0.16) 0px 0px 24px 0px`

## Motion

- **duration-fast:** `all`
- **duration-fast:** `none`
- **duration-fast:** `color 0.1s linear`
- **duration-base:** `inset 0.2s cubic-bezier(0.35, 0.12, 0.14, 1.42), border-radius 0.2s cubic-bezier(0.35, 0.12, 0.14, 1.42), box-shadow 0.2s cubic-bezier(0.22, 0.1, 0.1, 1)`
- **duration-base:** `color 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **duration-base:** `color 0.2s cubic-bezier(0.22, 0.1, 0.1, 1)`
- **duration-base:** `fill 0.2s cubic-bezier(0.22, 0.1, 0.1, 1)`

## Components

- **Buttons:** 257 detected
- **Links:** 31 detected
- **Inputs:** 1 detected
- **Navigation:** 2 elements
- **Lists:** 25 detected
- **Images:** 475 detected

## Do's and Don'ts

### Do

- Reference tokens by name, not raw values — agents and developers should use `color.text.primary`, not `#171717`.
- Define all interactive states: default, hover, focus-visible, active, disabled.
- Use the spacing scale for all padding, margin, and gap values.
- Write content in sentence case. Reserve ALL CAPS for acronyms only.
- Test every component at the smallest and largest breakpoint before shipping.

### Don't

- Do not introduce colors outside the extracted palette.
- Do not use arbitrary spacing values — stick to the scale.
- Do not mix border-radius values. Pin to the detected set (4px, 8px, 12px, 9999px).
- Do not stack more than one primary CTA per viewport.
- Do not use red for non-error UI — reserve it for destructive actions and warnings.
- Do not ship components without defining hover, focus-visible, and disabled states.

## Writing Tone

Persuasive, benefit-driven, trustworthy. Active voice, urgency without pressure.

## Authoring Workflow

When creating or updating a component guideline for this system, follow this sequence:

1. **State the intent** — one sentence on what the component does and why it exists.
2. **Map tokens** — list every color, spacing, typography, and radius token the component uses. No raw values.
3. **Define anatomy** — break the component into named parts (container, label, icon, etc.) with their token assignments.
4. **Specify states** — document every state: default, hover, focus-visible, active, disabled, loading, error, empty.
5. **Describe interactions** — keyboard, pointer, and touch behavior, including edge cases (long content, overflow, truncation).
6. **Add accessibility criteria** — write testable pass/fail checks (e.g. "focus ring must be visible at 3:1 contrast").
7. **List anti-patterns** — concrete examples of misuse with a brief explanation of why each is wrong.
8. **Close with a QA checklist** — a mechanical list of verifiable items (see Definition of Done below).

## Required Output Structure

Every component guideline produced from this system must contain these sections, in order:

1. Overview — purpose, when to use, when not to use.
2. Tokens and foundations — all referenced tokens from the tables above.
3. Anatomy and variants — named parts, variant matrix, responsive behavior.
4. States and interactions — full state table, keyboard/pointer/touch behavior.
5. Accessibility — ARIA attributes, contrast requirements, focus management, screen reader behavior.
6. Content guidelines — copy length, tone, capitalisation, placeholder text rules.
7. Anti-patterns — explicit examples of what not to build, with reasoning.

## Component Requirements

Every component built against this system must:

- Reference only tokens defined in the tables above — no hardcoded hex, px, or font values.
- Define all interactive states: default, hover, focus-visible, active, disabled, loading, error.
- Specify responsive behavior at the smallest and largest supported breakpoint.
- Handle edge cases: empty state, overflow / truncation, maximum content length.
- Include keyboard navigation (Tab, Enter, Escape, Arrow keys where applicable).
- Document ARIA roles, labels, and live-region behavior where relevant.
- Include known page component density: - **Buttons:** 257 detected
- **Links:** 31 detected
- **Inputs:** 1 detected
- **Navigation:** 2 elements
- **Lists:** 25 detected
- **Images:** 475 detected

## Definition of Done

A component is not complete until every item below is checked:

- Renders correctly in its default state (smoke test).
- All states documented and visually verified (hover, focus, disabled, loading, error, empty).
- All visual values use design tokens — zero hardcoded values.
- Keyboard navigation works without a pointer.
- No critical accessibility violations (contrast, ARIA, focus order).
- Tested at smallest and largest breakpoint.
- Anti-patterns section lists at least one concrete misuse example.
- Documentation covers purpose, usage, props/API, and limitations.
