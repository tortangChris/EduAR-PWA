## Bubble Sort

Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The largest element **_bubbles_** to the end of the array after each pass.

![Array Declaration](../photos/BubbleSort.gif)

**Steps:**

1. Compare adjacent elements.
2. Swap if the left element is greater than the right.
3. Repeat until no swaps are needed.

**Example in Java:**

```java
int[] arr = {5, 3, 8, 4, 2};
for (int i = 0; i < arr.length - 1; i++) {
    for (int j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j+1]) {
            int temp = arr[j];
            arr[j] = arr[j+1];
            arr[j+1] = temp;
        }
    }
}
```

Best for learning, but not efficient for large datasets (O(n²) time complexity).
