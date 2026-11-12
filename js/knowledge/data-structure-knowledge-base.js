import { DATA_STRUCTURES } from "../registry/data-structure-registry.js";

/**
 * DSA_L Data Structure Knowledge Base
 *
 * Knowledge is about selection criteria and operational trade-offs,
 * not just definitions.
 *
 * Complexities are general reference values. They must be interpreted
 * according to the actual implementation and its assumptions.
 */

export const DATA_STRUCTURE_KNOWLEDGE_BASE = Object.freeze({

  "Array": {
    purpose: "Store elements in an indexed sequence.",
    strengths: [
      "Constant-time indexed access.",
      "Cache-friendly sequential traversal.",
      "Simple representation of contiguous ranges."
    ],
    tradeOffs: [
      "Insertion or deletion in the middle generally requires shifting elements.",
      "Searching an unsorted array generally requires linear time."
    ],
    operations: {
      access: "O(1)",
      search: "O(n)",
      append: "Amortized O(1) for dynamic arrays",
      middleInsertion: "O(n)",
      middleDeletion: "O(n)"
    },
    selectionClues: [
      "indexed access",
      "contiguous range",
      "two pointers",
      "sorting",
      "sequential data"
    ],
    relatedPatterns: [
      "Two Pointers",
      "Sliding Window",
      "Prefix Sum",
      "Binary Search",
      "Merge Intervals"
    ]
  },

  "String": {
    purpose: "Represent and process a sequence of characters.",
    strengths: [
      "Natural representation for text and character sequences.",
      "Supports indexed character inspection."
    ],
    tradeOffs: [
      "JavaScript strings are immutable.",
      "Repeated concatenation can create additional allocations."
    ],
    operations: {
      indexedAccess: "O(1)",
      fullTraversal: "O(n)",
      substringCreation: "Depends on implementation and substring length"
    },
    selectionClues: [
      "substring",
      "palindrome",
      "character frequency",
      "text matching",
      "prefix"
    ],
    relatedPatterns: [
      "Two Pointers",
      "Sliding Window",
      "Hashing",
      "String Matching"
    ]
  },

  "Matrix": {
    purpose: "Represent data arranged by rows and columns.",
    strengths: [
      "Direct representation of grids and two-dimensional state.",
      "Convenient coordinate-based traversal."
    ],
    tradeOffs: [
      "Boundary checks are essential.",
      "Traversal order affects correctness."
    ],
    operations: {
      indexedAccess: "O(1) for array-backed matrices",
      fullTraversal: "O(rows × columns)"
    },
    selectionClues: [
      "grid",
      "row",
      "column",
      "island",
      "neighbour",
      "2D"
    ],
    relatedPatterns: [
      "Matrix / Grid Traversal",
      "Depth-First Search (DFS)",
      "Breadth-First Search (BFS)"
    ]
  },

  "Hash Map": {
    purpose: "Associate keys with values for efficient lookup and updates.",
    strengths: [
      "Expected O(1) lookup, insertion and deletion.",
      "Supports frequency counting and complement lookup.",
      "Can preserve additional information such as original indices."
    ],
    tradeOffs: [
      "Requires additional memory.",
      "Does not inherently provide sorted-key traversal.",
      "Worst-case operations can be O(n)."
    ],
    operations: {
      lookup: "Expected O(1)",
      insertion: "Expected O(1)",
      deletion: "Expected O(1)",
      worstCase: "O(n)"
    },
    selectionClues: [
      "two sum",
      "complement",
      "frequency",
      "count occurrences",
      "fast lookup",
      "seen before"
    ],
    relatedPatterns: [
      "Hashing",
      "Prefix Sum",
      "Dynamic Programming",
      "Counting / Frequency"
    ]
  },

  "Hash Set": {
    purpose: "Store unique values and support efficient membership checks.",
    strengths: [
      "Expected O(1) membership checks.",
      "Automatically enforces uniqueness."
    ],
    tradeOffs: [
      "Does not associate arbitrary additional values with each key.",
      "Does not inherently preserve sorted order."
    ],
    operations: {
      membership: "Expected O(1)",
      insertion: "Expected O(1)",
      deletion: "Expected O(1)"
    },
    selectionClues: [
      "duplicate detection",
      "unique elements",
      "membership",
      "already visited"
    ],
    relatedPatterns: [
      "Hashing",
      "Depth-First Search (DFS)",
      "Breadth-First Search (BFS)"
    ]
  },

  "Linked List": {
    purpose: "Represent a sequence through nodes connected by references.",
    strengths: [
      "Insertion or deletion can be O(1) when the relevant node and references are already available.",
      "Does not require contiguous storage."
    ],
    tradeOffs: [
      "Random access requires O(n) traversal.",
      "Additional memory is required for links.",
      "Pointer manipulation is error-prone."
    ],
    operations: {
      accessByPosition: "O(n)",
      search: "O(n)",
      insertionGivenPositionReference: "O(1)",
      deletionGivenNodeAndRequiredReferences: "O(1)"
    },
    selectionClues: [
      "linked nodes",
      "next pointer",
      "reverse list",
      "insert node",
      "delete node"
    ],
    relatedPatterns: [
      "Fast and Slow Pointers",
      "In-Place Linked List Reversal",
      "Two Pointers"
    ]
  },

  "Stack": {
    purpose: "Store elements using Last-In-First-Out ordering.",
    strengths: [
      "Constant-time top insertion and removal.",
      "Naturally supports backtracking and nested operations."
    ],
    tradeOffs: [
      "Only the top element is directly accessible."
    ],
    operations: {
      push: "O(1)",
      pop: "O(1)",
      peek: "O(1)"
    },
    selectionClues: [
      "last in first out",
      "next greater",
      "matching parentheses",
      "undo",
      "backtracking"
    ],
    relatedPatterns: [
      "Monotonic Stack",
      "Depth-First Search (DFS)",
      "Recursion"
    ]
  },

  "Queue": {
    purpose: "Store elements using First-In-First-Out ordering.",
    strengths: [
      "Processes elements in arrival order.",
      "Naturally maintains a breadth-first frontier."
    ],
    tradeOffs: [
      "A suitable implementation is needed to keep front removal efficient."
    ],
    operations: {
      enqueue: "O(1) with suitable implementation",
      dequeue: "O(1) with suitable implementation",
      front: "O(1)"
    },
    selectionClues: [
      "first in first out",
      "level order",
      "breadth first",
      "minimum steps",
      "processing order"
    ],
    relatedPatterns: [
      "Breadth-First Search (BFS)"
    ]
  },

  "Deque": {
    purpose: "Support insertion and deletion at both ends.",
    strengths: [
      "Efficient operations at the front and back.",
      "Can implement monotonic-window techniques."
    ],
    tradeOffs: [
      "More complex than a simple stack or queue.",
      "Implementation affects operation costs."
    ],
    operations: {
      insertFront: "O(1) with suitable implementation",
      insertBack: "O(1) with suitable implementation",
      removeFront: "O(1) with suitable implementation",
      removeBack: "O(1) with suitable implementation"
    },
    selectionClues: [
      "both ends",
      "sliding maximum",
      "sliding minimum",
      "monotonic queue"
    ],
    relatedPatterns: [
      "Monotonic Queue",
      "Sliding Window"
    ]
  },

  "Heap / Priority Queue": {
    purpose: "Maintain elements so the minimum or maximum priority can be retrieved efficiently.",
    strengths: [
      "O(1) access to the root priority.",
      "O(log n) insertion and extraction."
    ],
    tradeOffs: [
      "Arbitrary element lookup is generally O(n).",
      "The entire collection is not sorted."
    ],
    operations: {
      peek: "O(1)",
      insertion: "O(log n)",
      extractPriority: "O(log n)",
      arbitrarySearch: "O(n)"
    },
    selectionClues: [
      "top k",
      "k largest",
      "k smallest",
      "repeated minimum",
      "repeated maximum",
      "priority"
    ],
    relatedPatterns: [
      "Heap / Priority Queue",
      "Greedy",
      "K-way Merge"
    ]
  },

  "Binary Tree": {
    purpose: "Represent hierarchical data where each node has at most two children.",
    strengths: [
      "Models hierarchical relationships.",
      "Supports recursive and iterative traversals."
    ],
    tradeOffs: [
      "An ordinary binary tree does not guarantee sorted order.",
      "Traversal may require visiting every node."
    ],
    operations: {
      traversal: "O(n)",
      search: "O(n) in a general binary tree"
    },
    selectionClues: [
      "root",
      "left child",
      "right child",
      "level order",
      "tree traversal"
    ],
    relatedPatterns: [
      "Tree Traversal",
      "Depth-First Search (DFS)",
      "Breadth-First Search (BFS)"
    ]
  },

  "Binary Search Tree": {
    purpose: "Maintain ordered values using the binary-search-tree ordering property.",
    strengths: [
      "Supports ordered searching, insertion and deletion.",
      "Can support sorted traversal."
    ],
    tradeOffs: [
      "An unbalanced tree can degrade to O(n) height.",
      "Balanced variants have more complicated maintenance."
    ],
    operations: {
      search: "O(h)",
      insertion: "O(h)",
      deletion: "O(h)",
      balancedHeight: "O(log n)",
      worstCaseHeight: "O(n)"
    },
    selectionClues: [
      "ordered set",
      "predecessor",
      "successor",
      "range query",
      "sorted traversal"
    ],
    relatedPatterns: [
      "Binary Search",
      "Tree Traversal"
    ]
  },

  "N-ary Tree": {
    purpose: "Represent hierarchical data where a node can have multiple children.",
    strengths: [
      "Naturally models multi-branch hierarchies.",
      "Supports DFS and BFS traversal."
    ],
    tradeOffs: [
      "Traversal requires handling a variable number of children."
    ],
    operations: {
      traversal: "O(n)"
    },
    selectionClues: [
      "multiple children",
      "hierarchy",
      "organizational tree",
      "directory tree"
    ],
    relatedPatterns: [
      "Tree Traversal",
      "Depth-First Search (DFS)",
      "Breadth-First Search (BFS)"
    ]
  },

  "Trie": {
    purpose: "Represent strings through shared prefixes.",
    strengths: [
      "Prefix queries can be proportional to the query length.",
      "Shares common prefixes between stored strings."
    ],
    tradeOffs: [
      "Can consume substantial memory.",
      "Child representation affects space and runtime."
    ],
    operations: {
      insert: "O(L) typical",
      search: "O(L) typical",
      prefixSearch: "O(L) before enumerating matches"
    },
    selectionClues: [
      "prefix",
      "autocomplete",
      "dictionary",
      "word search",
      "starts with"
    ],
    relatedPatterns: [
      "Trie-based Search"
    ]
  },

  "Graph": {
    purpose: "Represent entities connected by relationships.",
    strengths: [
      "Models directed, undirected and weighted relationships.",
      "Supports connectivity and path algorithms."
    ],
    tradeOffs: [
      "Representation affects memory and operation costs.",
      "Cycles and disconnected components require careful handling."
    ],
    operations: {
      traversal: "O(V + E) using adjacency lists",
      storage: "Depends on graph representation"
    },
    selectionClues: [
      "vertices",
      "edges",
      "connected",
      "path",
      "network",
      "dependencies"
    ],
    relatedPatterns: [
      "Depth-First Search (DFS)",
      "Breadth-First Search (BFS)",
      "Shortest Path",
      "Topological Sorting",
      "Union-Find"
    ]
  },

  "Graph Adjacency List": {
    purpose: "Store each vertex with a collection of its neighbours.",
    strengths: [
      "Space-efficient for sparse graphs.",
      "Efficiently iterates through a vertex's neighbours."
    ],
    tradeOffs: [
      "Testing whether a particular edge exists may require scanning neighbours."
    ],
    operations: {
      storage: "O(V + E)",
      traverseNeighbours: "O(degree of vertex)",
      edgeLookup: "O(degree of vertex) in a simple list"
    },
    selectionClues: [
      "sparse graph",
      "neighbours",
      "BFS",
      "DFS"
    ],
    relatedPatterns: [
      "Depth-First Search (DFS)",
      "Breadth-First Search (BFS)",
      "Shortest Path"
    ]
  },

  "Graph Adjacency Matrix": {
    purpose: "Represent graph edges in a two-dimensional matrix.",
    strengths: [
      "Constant-time edge existence checks.",
      "Simple representation for dense graphs."
    ],
    tradeOffs: [
      "Requires O(V²) space.",
      "Iterating through neighbours requires scanning a row."
    ],
    operations: {
      storage: "O(V²)",
      edgeLookup: "O(1)",
      traverseNeighbours: "O(V)"
    },
    selectionClues: [
      "dense graph",
      "matrix representation",
      "constant-time edge lookup"
    ],
    relatedPatterns: [
      "Graph Traversal",
      "Shortest Path"
    ]
  },

  "Disjoint Set Union (Union-Find)": {
    purpose: "Maintain and merge disjoint groups while supporting connectivity queries.",
    strengths: [
      "Efficient union and connectivity operations with path compression and union by rank or size."
    ],
    tradeOffs: [
      "Does not directly maintain general graph path information.",
      "Supports a restricted set of operations."
    ],
    operations: {
      find: "Amortized near O(1) with standard optimizations",
      union: "Amortized near O(1) with standard optimizations"
    },
    selectionClues: [
      "merge groups",
      "connected components",
      "dynamic connectivity",
      "same component"
    ],
    relatedPatterns: [
      "Union-Find",
      "Minimum Spanning Tree"
    ]
  },

  "Segment Tree": {
    purpose: "Maintain range information while supporting efficient updates and queries.",
    strengths: [
      "Supports many range-query and point-update combinations.",
      "Can be extended with lazy propagation for range updates."
    ],
    tradeOffs: [
      "More complex than prefix sums.",
      "Requires additional memory."
    ],
    operations: {
      build: "O(n)",
      query: "O(log n)",
      pointUpdate: "O(log n)"
    },
    selectionClues: [
      "range minimum",
      "range maximum",
      "range sum with updates",
      "dynamic range queries"
    ],
    relatedPatterns: [
      "Divide and Conquer"
    ]
  },

  "Fenwick Tree (Binary Indexed Tree)": {
    purpose: "Maintain prefix aggregates with efficient updates and queries.",
    strengths: [
      "Compact representation.",
      "Efficient point updates and prefix queries for suitable operations."
    ],
    tradeOffs: [
      "Less flexible than a Segment Tree for arbitrary operations.",
      "Range operations require suitable inverse operations or adaptations."
    ],
    operations: {
      build: "O(n log n) with repeated updates; O(n) with specialized construction",
      update: "O(log n)",
      prefixQuery: "O(log n)"
    },
    selectionClues: [
      "prefix frequency",
      "point updates",
      "range sum with updates"
    ],
    relatedPatterns: [
      "Prefix Sum"
    ]
  },

  "Sparse Table": {
    purpose: "Answer static range queries using precomputed overlapping intervals.",
    strengths: [
      "O(1) queries for suitable idempotent operations such as minimum or maximum."
    ],
    tradeOffs: [
      "Requires preprocessing and O(n log n) memory.",
      "Not suitable for ordinary dynamic updates."
    ],
    operations: {
      preprocessing: "O(n log n)",
      query: "O(1) for suitable idempotent operations",
      update: "Generally requires rebuilding"
    },
    selectionClues: [
      "static range minimum",
      "static range maximum",
      "no updates"
    ],
    relatedPatterns: [
      "Divide and Conquer"
    ]
  },

  "Ordered Set / Balanced Search Tree": {
    purpose: "Maintain ordered unique values with efficient search, insertion and deletion.",
    strengths: [
      "Supports ordered operations.",
      "Balanced implementations maintain logarithmic height."
    ],
    tradeOffs: [
      "More complex than a Hash Set.",
      "Costs depend on the balancing and implementation strategy."
    ],
    operations: {
      search: "O(log n) in balanced implementations",
      insertion: "O(log n) in balanced implementations",
      deletion: "O(log n) in balanced implementations"
    },
    selectionClues: [
      "ordered values",
      "predecessor",
      "successor",
      "nearest element",
      "range lookup"
    ],
    relatedPatterns: [
      "Binary Search",
      "Greedy"
    ]
  },

  "Call Stack": {
    purpose: "Represent active function calls, their local state and return locations.",
    strengths: [
      "Models recursion and nested function execution.",
      "Explains how calls suspend and resume."
    ],
    tradeOffs: [
      "Deep recursion can exhaust the runtime call stack.",
      "Call-stack memory grows with active recursion depth."
    ],
    operations: {
      pushCall: "O(1) conceptual operation",
      returnFromCall: "O(1) conceptual operation",
      space: "O(recursion depth)"
    },
    selectionClues: [
      "recursion",
      "recursive call",
      "call stack",
      "backtracking",
      "function return"
    ],
    relatedPatterns: [
      "Recursion",
      "Depth-First Search (DFS)",
      "Backtracking"
    ]
  }

});

/**
 * Registry structures without a curated knowledge record.
 */
export const DATA_STRUCTURE_KNOWLEDGE_GAPS = Object.freeze(
  DATA_STRUCTURES.filter(
    structure => !Object.hasOwn(DATA_STRUCTURE_KNOWLEDGE_BASE, structure)
  )
);

export function getDataStructureKnowledge(structureName) {
  return DATA_STRUCTURE_KNOWLEDGE_BASE[structureName] || null;
}
