# UI Gap Analysis: Current vs. Desired Epic Theme

Based on the review of your current UI screenshot (`uploaded_image_1765792160675.png`) compared to the desired "Epic Detailed Page" look, here are the missing elements and discrepancies:

## 1. Missing Content Containment (Critical)
*   **Current State**: The **Description text** and **Linked Issue items** are displayed directly on the white background of the main column. They lack a distinct container.
*   **Desired State**: These content areas should be visual "boxes".
    *   **Description**: The text content (e.g., "Updated Vertical Navigation...") should be inside a **Light Gray Rounded Box** (`#FAFAFA` or `#F5F5F5`) with internal padding.
    *   **Linked Issues**: The list of issues should similarly be enclosed in a **Light Gray Box**.
    *   **Effect**: This creates a "Field" aesthetic, clearly separating the label ("Description") from the value/content.

## 2. Voice Assistant Button Placement
*   **Issue**: You noted the **Voice Assistant is missing**.
*   **Observation**: The Microphone icon *is* present in the top-right global header in your screenshot.
*   **Analysis**: Its placement in the *Global Header* might make it feel disconnected from its actual purpose (writing the Description). Users often look for the "Write/Edit" tools *next to the content* they are editing.
*   **Recommendation/Fix**: Move (or duplicate) the **Voice Assistant Button** to the **Description Section Header**, right next to the "Edit" button. This ensures it is found exactly where it is needed for *all issue types*.

## 3. Background Contrast
*   **Current State**: The distinct "Beige" background (`#FAF9F7`) surrounding the main "White Card" appears subtle or potentially missing in the crop (it looks mostly white).
*   **Desired State**: Ensure the **Outer Layout** is clearly Beige, and the **Central Content** is a distinct White Card with a visible boundary (shadow or distinct color difference), so the card-on-background effect is achieved.

## 4. Typography & Spacing
*   **Description Text**: Currently looks like standard size. The desired look often uses a slightly more focused or "Input-like" typography when inside the gray box.
*   **Margins**: The vertical spacing between "Description" and the text feels tight. The Gray Box approach will naturally enforce better padding (`16px`-`24px`).

## Next Steps (Plan)
1.  **Refactor Description Section**: Wrap the description markdown content in a `<ContentBox>` styled component (Light Gray background).
2.  **Refactor Linked Issues**: Wrap the list in the same `<ContentBox>`.
3.  **Relocate Voice Assistant**: Add the `<VoiceDescriptionButton>` to the **Description Section Header** alongside the "Edit" button for immediate visibility and context in all issue types.
