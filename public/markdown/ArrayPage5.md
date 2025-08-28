# Deletion (O(n))

- **Deletion** = removing an element from the array.
- All elements **to the right** of the deleted index must **shift left** to fill the gap.
- **Worst-case Time Complexity:** `O(n)` (when deleting at the beginning or middle).

- **Example**
  ```text
  arr = [10, 20, 30, 40]
  Delete element at index 2:
  → [10, 20, 40]
  ```
