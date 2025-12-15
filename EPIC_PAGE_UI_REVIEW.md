# Epic Page UI & Theme Review

Based on the provided screenshot of the Epic Detailed Page, here is a comprehensive review of the UI structure, color palette, and component styling.

## 1. Global Layout & Theme
*   **Background**: The application uses a distinctive **Light Beige / Off-White (#FAF9F7)** background, creating a warm, premium feel.
*   **Central Concept**: The content is presented within a **Unified White Canvas/Card**. This card appears to be centered with generous margins, featuring rounded corners (approx. 12px-16px).
*   **Whitespace**: There is significant breathing room (padding) around the edges of the white card, separating it from the beige application background.

## 2. Header Section
*   **Style**: Minimalist and Clean.
*   **Elements**:
    *   **Back Navigation**: Simple left arrow icon.
    *   **Issue Identifier**: A **Pink Pill Badge (#E91E63)** containing the Issue Key (e.g., "FIVE-14"). Text is white, font-weight bold.
    *   **Title**: Displayed immediately next to the badge in **Bold, Dark Text (#1A1A1A)**.
    *   **Actions**: Located on the far right. Circular icon buttons (Link, Microphone) with a light gray background, maintaining a subtle profile until interaction.

## 3. Content Sections (Description & Linked Issues)
*   **Structure**:
    *   **Section Headers**: The titles ("Description", "Linked Issues (0)") and their associated actions ("Edit", "Link Issue") are displayed on the **White** background of the main card.
    *   **Content Containers**: The actual content (e.g., the description text or the empty state message) is encapsulated within a **Light Gray Box (#FAFAFA or #F5F5F5)**.
    *   **Visual Hierarchy**: This "Box within a Card" design clearly separates the label from the content field, mimicking the look of an interactive form field or a distinct text block.
    *   **Typography**:
        *   Placeholders use *Italicized Light Gray Text*.
        *   Section Headers utilize a **Dark Navy/Gray (#2C3E50)** for contrast.

## 4. Tabs & Activity Area
*   **Tabs Navigation**:
    *   **Style**: Clean horizontal text tabs with no surrounding borders/boxes.
    *   **Active State**: Highlighted with **Pink Text (#E91E63)** and a matching **Pink Bottom Border (3px)**.
    *   **Inactive State**: Gray text, unobtrusive.
*   **Comments Section**:
    *   **Input Area**: A large text area with a light gray border.
    *   **Primary Action**: The "Add Comment" button uses the **Theme Pink (#E91E63)** background with white text. It has a flat design (no shadow) and rounded corners (6px).

## 5. Color Palette Summary
| Element | Color | Hex (Approx) |
| :--- | :--- | :--- |
| **Page Background** | Light Beige | `#FAF9F7` |
| **Card Background** | Pure White | `#FFFFFF` |
| **Primary Accent** | Bright Pink | `#E91E63` |
| **Content Boxes** | Light Gray | `#F5F5F5` / `#FAFAFA` |
| **Text (Primary)** | Dark Gray/Black | `#1A1A1A` |
| **Text (Secondary)** | Medium Gray | `#999999` |

## 6. Implementation Notes
To achieve this exact look:
*   Ensure the `LayoutContainer` applies the Beige background.
*   Wrap the entire details view (Header + Content) in a `MainContentCard` with `background: white; border-radius: 16px; margin: 24px;`.
*   **Crucial Detail**: The "Sections" should likely *not* have a gray background themselves. Instead, the **Content** inside the section (e.g., `<MarkdownContent>` or `<EmptyStateText>`) should be wrapped in a styling block with `background: #FAFAFA; padding: 16px; border-radius: 8px;` styling. The *Section Header* remains on the white background above this box.
