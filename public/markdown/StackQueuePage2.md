# Stack Operations & Complexity

- **Push (Add):** O(1) – place item on top.
- **Pop (Remove):** O(1) – remove top item.
- **Peek (View Top):** O(1).
- Stacks do **not allow random access** (unlike arrays).

- **Example**
  ```text
  Stack: [Bottom] 10, 20, 30 [Top]
  Push 40 → [Bottom] 10, 20, 30, 40 [Top]
  Pop → removes 40
  ```

### 🎨 3D Visual

- Animation: new block slides on top (push).
- Top block vanishes when popped.

### 🌐 AR Visual

- User performs gestures:
  - Swipe up → push new box.
  - Tap top box → pop it.
