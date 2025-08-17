## Accessing Array Elements

Array elements are accessed using an **index**, starting at **0**.

**Example in Java:**

```java
numbers[0] = 10;   // assigns 10 to the first element
numbers[1] = 20;   // assigns 20 to the second element

System.out.println(numbers[0]); // prints 10
```

- `numbers[0]` → first element
- `numbers[1]` → second element
- `numbers[n-1]` → last element (where n is the size of the array)

Accessing outside the array’s range will cause an **ArrayIndexOutOfBoundsException**.
