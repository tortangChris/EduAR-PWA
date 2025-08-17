## Skip List

### Multi-level Linked List with Shortcuts

A **Skip List** is a data structure that extends the concept of a linked list by adding **multiple levels of pointers (shortcuts)**.

- Each higher level acts as an “express lane” to skip over multiple nodes, making searches faster.
- At the base level, it functions like a normal linked list.

**Key Points:**

- Improves search time to `O(log n)` compared to `O(n)` in normal linked lists.
- Balances efficiency and simplicity.
- Commonly used in applications like databases and memory management.

![Skip List Example](../photos/)
