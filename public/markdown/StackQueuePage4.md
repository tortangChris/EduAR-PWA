# Queue Operations & Complexity

- **Enqueue (Add):** O(1) – place item at rear.
- **Dequeue (Remove):** O(1) – remove item from front.
- **Peek (View Front):** O(1).
- Queues process elements in the order they arrive.

- **Example**
  ```text
  Queue: [Front] 10, 20, 30 [Rear]
  Enqueue 40 → [Front] 10, 20, 30, 40 [Rear]
  Dequeue → removes 10
  ```

### 🎨 3D Visual

- Animation: new box joins from the right.
- Leftmost box exits smoothly.

### 🌐 AR Visual

- Student taps rear → new element enqueued.
- Student taps front → element dequeued.
