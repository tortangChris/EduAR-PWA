# Circular Linked List

- **Definition:** Last node points back to the **head**, forming a loop.
- Can be **singly circular** (only Next points in loop) or **doubly circular**.
- **Use Case:** Useful in scenarios requiring continuous traversal (e.g., round-robin scheduling).
- **Example:**
  ```
  [10|Next] → [20|Next] → [30|Next]
         ↑________________________↓
  ```
