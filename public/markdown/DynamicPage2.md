# Dynamic Array Resizing (Amortized O(1))

- When a dynamic array becomes **full**, a **new larger array** is created.
- All elements are **copied over** to the new array.
- The new element is then added.
- **Append Complexity:**
  - Usually `O(1)` (fast).
  - But resizing requires copying → `O(n)`.
  - On **average**, appends are **Amortized O(1)**.

