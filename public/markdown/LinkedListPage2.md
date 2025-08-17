## Circular Linked List

### Nodes Form a Loop

A **Circular Linked List** is a variation of the linked list where:

- The **last node points back to the first node**, forming a circle.

**Types:**

- **Singly Circular Linked List**: last node points to the head.
- **Doubly Circular Linked List**: last node points to head, and head’s previous points back to the tail.

**Key Points:**

- Useful for applications like round-robin scheduling.
- Traversal can start from any node and still cover the entire list.

![Circular Linked List Example](../photos/CircularLinkedList.gif)
