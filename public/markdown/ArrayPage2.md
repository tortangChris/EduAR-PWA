## 1. Declaring Arrays

To use an array, we must first declare it.  
Declaration tells the program what type of values the array will hold.

**Example in Java:**

```java
int[] numbers;
String[] names;
```

- `int[] numbers;` → declares an array that can hold integers.
- `String[] names;` → declares an array that can hold strings.

_Declaration does not allocate memory yet; it only defines the type._

---

## 2. Creating Arrays

After declaring an array, we need to create it using the `new` keyword. This step allocates memory and specifies the size of the array.

**Example in Java:**

```java
numbers = new int[5];
names = new String[3];
```

- `new int[5];` → creates an array of 5 integers.
- `new String[3];` → creates an array of 3 strings.

We can also declare and create in one line:

```java
int[] numbers = new int[5];
```

👉 The size of the array is fixed once created.
