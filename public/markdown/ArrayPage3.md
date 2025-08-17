## 3. Accessing Array Elements

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

---

## 4. Looping Through Arrays

Since arrays contain multiple elements, we often use **loops** to access them efficiently.

### For Loop

```java
for(int i = 0; i < numbers.length; i++) {
    System.out.println(numbers[i]);
}
```

- `numbers.length` → returns the size of the array.
- The loop runs from `i = 0` up to `i < numbers.length`.

### Enhanced For Loop (For-Each)

```java
for(int num : numbers) {
    System.out.println(num);
}
```

- Automatically goes through each element of the array.
- Easier to use when you just want to read values.

---

## Summary

- **Declaring** → defines the type of array.
- **Creating** → allocates memory and sets size.
- **Accessing** → retrieves or assigns values using index.
- **Looping** → allows us to process all elements efficiently.

Arrays are powerful tools that help organize and manage collections of data in programming.
