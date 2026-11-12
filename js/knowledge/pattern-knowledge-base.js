import { PATTERNS } from "../registry/pattern-registry.js";

/**
 * DSA_L Pattern Knowledge Base
 *
 * Curated algorithmic knowledge, independent of AI-generated responses.
 * Only patterns with explicit knowledge records are considered curated.
 */

export const PATTERN_KNOWLEDGE_BASE = Object.freeze({

  "Hashing": {
    purpose: "Use key-based storage to make lookup, membership and frequency operations efficient.",

    clues: [
      "two sum",
      "pair sum",
      "complement",
      "frequency",
      "count occurrences",
      "duplicate detection",
      "fast lookup",
      "seen before"
    ],

    useWhen: [
      "The algorithm repeatedly searches for previously encountered values.",
      "Frequency counting is required.",
      "A complement or relationship can be represented as a lookup key.",
      "Repeated linear searching would be inefficient."
    ],

    avoidWhen: [
      "The problem requires ordered traversal and key ordering is essential.",
      "The required state cannot be represented safely by hashable keys."
    ],

    conditions: [
      "Account for hash collisions and expected versus worst-case complexity.",
      "Choose keys that preserve the identity required by the problem."
    ],

    structures: ["Array", "Hash Map", "Hash Set"],

    strengths: [
      "Expected constant-time lookup, insertion and deletion.",
      "Efficient frequency counting.",
      "Can reduce repeated searching."
    ],

    limitations: [
      "Requires additional memory.",
      "Does not inherently preserve sorted order.",
      "Worst-case operations can degrade due to collisions."
    ],

    questionsToAsk: [
      "Do I need to remember previously encountered values?",
      "Can I calculate the value I need to search for?",
      "Would a frequency table solve the problem?"
    ]
  },

  "Two Pointers": {
    purpose: "Use two coordinated positions to examine or process a sequence efficiently.",

    clues: [
      "pair in sorted array",
      "two numbers",
      "opposite ends",
      "left and right",
      "in-place",
      "palindrome",
      "remove duplicates"
    ],

    useWhen: [
      "The input is sorted and a pair or range must be located.",
      "Two positions can move according to a useful invariant.",
      "An in-place sequence transformation is required."
    ],

    avoidWhen: [
      "Unsorted input has no suitable monotonic property.",
      "Moving either pointer could discard a valid solution.",
      "The pointer movement rule cannot be justified."
    ],

    conditions: [
      "For pair-sum problems, sorted order makes the standard inward-moving technique valid.",
      "Sorting an unsorted input may be possible, but introduces preprocessing cost.",
      "Preserve original indices when sorting if the problem asks for indices."
    ],

    structures: ["Array", "String", "Linked List"],

    strengths: [
      "Often reduces quadratic pair searching to linear scanning.",
      "Can operate in constant auxiliary space.",
      "Useful for in-place transformations."
    ],

    limitations: [
      "Requires a valid pointer movement invariant.",
      "Sorting may change input order and require additional memory."
    ],

    questionsToAsk: [
      "Does the input have a useful ordering?",
      "What tells me that the left pointer should move?",
      "What tells me that the right pointer should move?"
    ]
  },

  "Sliding Window": {
    purpose: "Maintain information about a contiguous range while its boundaries move.",

    clues: [
      "subarray",
      "substring",
      "contiguous",
      "longest",
      "shortest",
      "maximum window",
      "minimum window",
      "consecutive elements"
    ],

    useWhen: [
      "The problem asks about contiguous ranges.",
      "Window information can be updated incrementally.",
      "The window can expand or shrink without losing the correctness invariant."
    ],

    avoidWhen: [
      "The problem concerns arbitrary non-contiguous subsequences.",
      "The window adjustment rule is not monotonic.",
      "Negative values invalidate a proposed sum-based greedy window rule."
    ],

    conditions: [
      "Identify exactly what makes a window valid.",
      "For standard sum-threshold shrinking techniques, non-negative values are often necessary.",
      "Other window problems may require different invariants."
    ],

    structures: ["Array", "String", "Hash Map", "Hash Set"],

    strengths: [
      "Can reduce repeated range calculations.",
      "Often achieves linear time.",
      "Maintains only the current range state."
    ],

    limitations: [
      "Incorrect boundary movement can skip valid answers.",
      "Not every contiguous-range problem is a sliding-window problem."
    ],

    questionsToAsk: [
      "Is the required range contiguous?",
      "What information must the current window maintain?",
      "When does the window become invalid?",
      "Can it be restored by moving one boundary?"
    ]
  },

  "Prefix Sum": {
    purpose: "Precompute cumulative values to answer range and subarray-sum queries efficiently.",

    clues: [
      "range sum",
      "subarray sum",
      "sum equals k",
      "cumulative sum",
      "multiple range queries",
      "sum between indices"
    ],

    useWhen: [
      "Many range-sum calculations are needed.",
      "A subarray condition can be transformed using prefix differences.",
      "Cumulative state helps reduce repeated calculations."
    ],

    avoidWhen: [
      "The operation is not efficiently represented by a cumulative aggregate.",
      "Frequent updates make a static prefix array unsuitable without additional structures."
    ],

    conditions: [
      "Define whether prefix[i] represents elements before or including index i.",
      "Handle empty prefixes and boundary indices consistently.",
      "Negative values are supported for ordinary sum-prefix reasoning."
    ],

    structures: ["Array", "Hash Map"],

    strengths: [
      "Range sums can be calculated in constant time after preprocessing.",
      "Can support subarray-sum counting with a Hash Map."
    ],

    limitations: [
      "Static prefix arrays require rebuilding after arbitrary updates.",
      "Careful indexing is essential."
    ],

    questionsToAsk: [
      "Can a range result be expressed as prefix[right] minus prefix[left]?",
      "Are there repeated range queries?",
      "Can the required condition be transformed into a prefix relationship?"
    ]
  },

  "Binary Search": {
    purpose: "Eliminate half of a search space using a valid ordering or monotonic condition.",

    clues: [
      "sorted array",
      "find position",
      "search element",
      "first occurrence",
      "last occurrence",
      "lower bound",
      "upper bound"
    ],

    useWhen: [
      "The search domain has an ordering.",
      "A monotonic condition lets us safely discard part of the search space."
    ],

    avoidWhen: [
      "The search space has no applicable ordering or monotonic property."
    ],

    conditions: [
      "Maintain a precise search interval invariant.",
      "Define inclusive or exclusive boundaries consistently."
    ],

    structures: ["Array"],

    strengths: [
      "Logarithmic search on suitable ordered domains.",
      "Efficiently finds boundaries."
    ],

    limitations: [
      "Requires justified monotonicity.",
      "Boundary errors can cause infinite loops or missed results."
    ],

    questionsToAsk: [
      "What property allows half the search space to be discarded?",
      "What does the current interval represent?",
      "When does the search terminate?"
    ]
  },

  "Binary Search on Answer": {
    purpose: "Search for an optimal answer when feasibility changes monotonically across candidate values.",

    clues: [
      "minimum possible",
      "maximum possible",
      "minimum capacity",
      "maximum distance",
      "minimize the maximum",
      "maximize the minimum"
    ],

    useWhen: [
      "Candidate answers form an ordered numeric search space.",
      "A feasibility test can be defined.",
      "Feasibility is monotonic."
    ],

    avoidWhen: [
      "Feasibility changes irregularly across candidate answers.",
      "No efficient feasibility test can be established."
    ],

    conditions: [
      "Prove the direction of monotonicity.",
      "Define valid answer bounds.",
      "Verify whether the goal is the first feasible or last feasible answer."
    ],

    structures: ["Array"],

    strengths: [
      "Can optimize answers over large numeric domains."
    ],

    limitations: [
      "A wrong feasibility predicate invalidates the solution.",
      "The number of checks depends on the search range."
    ],

    questionsToAsk: [
      "Can I check whether a candidate answer works?",
      "Does feasibility remain true or false consistently after a boundary?"
    ]
  },

  "Greedy": {
    purpose: "Build a solution through locally chosen decisions supported by a correctness argument.",

    clues: [
      "maximum number of activities",
      "minimum number of operations",
      "choose earliest",
      "choose smallest",
      "schedule",
      "locally optimal"
    ],

    useWhen: [
      "A local decision can be shown to be part of an optimal solution.",
      "An exchange argument or greedy-choice property can be established."
    ],

    avoidWhen: [
      "Local decisions can prevent a globally optimal result.",
      "The problem has important interactions between future decisions."
    ],

    conditions: [
      "Establish a greedy-choice property.",
      "Establish optimal substructure where applicable.",
      "Prove the strategy rather than relying on intuition."
    ],

    structures: ["Array", "Heap / Priority Queue"],

    strengths: [
      "Often produces efficient algorithms.",
      "Can require little auxiliary state."
    ],

    limitations: [
      "A plausible local choice is not automatically globally optimal."
    ],

    questionsToAsk: [
      "Why is this local decision safe?",
      "Can an optimal solution always be transformed to include my choice?"
    ]
  },

  "Dynamic Programming": {
    purpose: "Solve problems by reusing answers to overlapping subproblems.",

    clues: [
      "number of ways",
      "maximum profit",
      "minimum cost",
      "optimal solution",
      "overlapping subproblems",
      "choose or skip",
      "state transition"
    ],

    useWhen: [
      "The problem has overlapping subproblems.",
      "Subproblems have reusable states.",
      "A transition connects smaller states to larger ones."
    ],

    avoidWhen: [
      "The state does not capture enough information.",
      "Subproblems do not meaningfully overlap."
    ],

    conditions: [
      "Define the state precisely.",
      "Establish base cases.",
      "Derive correct transitions.",
      "Determine evaluation order."
    ],

    structures: ["Array", "Hash Map"],

    strengths: [
      "Avoids recomputing overlapping subproblems.",
      "Can turn exponential recursion into polynomial-time algorithms."
    ],

    limitations: [
      "State design can be difficult.",
      "Memory can become substantial."
    ],

    questionsToAsk: [
      "What is the smallest subproblem?",
      "What information defines a state?",
      "How does a state depend on previous states?"
    ]
  },

  "Depth-First Search (DFS)": {
    purpose: "Explore a graph or tree deeply before returning to earlier branching points.",

    clues: [
      "connected components",
      "all paths",
      "reachability",
      "cycle detection",
      "explore every branch",
      "tree traversal"
    ],

    useWhen: [
      "Deep exploration is appropriate.",
      "Reachability, component discovery or path exploration is required."
    ],

    avoidWhen: [
      "The shortest path in an unweighted graph is required and BFS is appropriate.",
      "Recursion depth can exceed safe runtime limits without an iterative approach."
    ],

    conditions: [
      "Track visited vertices when needed.",
      "Account for graph disconnection.",
      "Distinguish directed and undirected edges."
    ],

    structures: ["Graph", "Graph Adjacency List", "Stack", "Call Stack"],

    strengths: [
      "Supports component discovery and structural exploration.",
      "Can be implemented recursively or iteratively."
    ],

    limitations: [
      "Does not generally guarantee shortest paths.",
      "Recursive implementations can exhaust the call stack."
    ],

    questionsToAsk: [
      "What counts as visited?",
      "When should exploration backtrack?",
      "Does the graph contain cycles?"
    ]
  },

  "Breadth-First Search (BFS)": {
    purpose: "Explore vertices in increasing order of distance in an unweighted graph.",

    clues: [
      "level by level",
      "minimum number of edges",
      "shortest path in unweighted graph",
      "nearest",
      "minimum moves",
      "minimum steps"
    ],

    useWhen: [
      "Level-order traversal is required.",
      "Shortest paths by edge count are required in an unweighted graph."
    ],

    avoidWhen: [
      "Edges have arbitrary weights and ordinary BFS would not preserve shortest-path correctness."
    ],

    conditions: [
      "Use a FIFO queue.",
      "Mark vertices visited at the appropriate discovery point.",
      "Account for disconnected components when necessary."
    ],

    structures: ["Graph", "Graph Adjacency List", "Queue", "Binary Tree"],

    strengths: [
      "Finds shortest paths by number of edges in unweighted graphs.",
      "Naturally supports level-by-level traversal."
    ],

    limitations: [
      "Can use substantial memory for wide frontiers.",
      "Ordinary BFS is not a general weighted shortest-path algorithm."
    ],

    questionsToAsk: [
      "Is every edge treated as equal cost?",
      "What is the current frontier?",
      "When should a vertex be marked visited?"
    ]
  },

  "Monotonic Stack": {
    purpose: "Maintain a stack in increasing or decreasing order to answer next-greater, next-smaller and span queries.",

    clues: [
      "next greater element",
      "next smaller element",
      "previous greater element",
      "previous smaller element",
      "nearest larger element",
      "histogram rectangle"
    ],

    useWhen: [
      "The nearest qualifying element on one side is required.",
      "A monotonic ordering can eliminate previously dominated candidates."
    ],

    avoidWhen: [
      "No useful monotonic invariant exists."
    ],

    conditions: [
      "Choose increasing or decreasing stack order correctly.",
      "Handle equal values according to strict or non-strict comparison requirements."
    ],

    structures: ["Array", "Stack"],

    strengths: [
      "Many next-element problems can be solved in linear time.",
      "Each element is typically pushed and popped at most once."
    ],

    limitations: [
      "Duplicate-value handling is subtle.",
      "The invariant must match the comparison requirement."
    ],

    questionsToAsk: [
      "What does the stack represent?",
      "When should an element be removed?",
      "Should equal elements remain?"
    ]
  },

  "Heap / Priority Queue": {
    purpose: "Repeatedly retrieve the smallest or largest element efficiently.",

    clues: [
      "top k",
      "k largest",
      "k smallest",
      "frequently minimum",
      "frequently maximum",
      "priority",
      "next smallest"
    ],

    useWhen: [
      "The next minimum or maximum must be retrieved repeatedly.",
      "Only a limited number of best candidates need to be maintained."
    ],

    avoidWhen: [
      "A single sort is simpler and there are no repeated priority operations.",
      "Arbitrary ordered searches are required."
    ],

    conditions: [
      "Choose min-heap or max-heap based on the required priority.",
      "Choose heap size according to the problem."
    ],

    structures: ["Heap / Priority Queue", "Array"],

    strengths: [
      "Constant-time access to the root priority.",
      "Logarithmic insertion and extraction."
    ],

    limitations: [
      "Arbitrary lookup is not generally efficient.",
      "A heap does not maintain complete sorted order."
    ],

    questionsToAsk: [
      "Which item must be retrieved next?",
      "Do I need all elements sorted or only the next extreme?",
      "Can I restrict the heap to K elements?"
    ]
  },

  "Merge Intervals": {
    purpose: "Combine overlapping or compatible intervals into a consolidated representation.",

    clues: [
      "overlapping intervals",
      "merge ranges",
      "meeting times",
      "calendar intervals",
      "insert interval"
    ],

    useWhen: [
      "Intervals must be combined according to an overlap rule.",
      "Sorting by interval boundary provides a useful processing order."
    ],

    avoidWhen: [
      "The problem requires preserving independent interval identities rather than merging them."
    ],

    conditions: [
      "Define whether touching boundaries count as overlap.",
      "Sort by an appropriate boundary before scanning."
    ],

    structures: ["Array"],

    strengths: [
      "Often achieves O(n log n) time using sorting followed by a linear scan."
    ],

    limitations: [
      "Incorrect boundary comparisons can merge or separate intervals incorrectly."
    ],

    questionsToAsk: [
      "Do touching intervals overlap?",
      "Which interval boundary should determine sorting?",
      "What is the current merged interval?"
    ]
  },

  "In-Place Linked List Reversal": {
    purpose: "Reverse linked-list connections without constructing an entirely new list.",

    clues: [
      "reverse linked list",
      "reverse pointers",
      "reverse in place",
      "reverse between positions"
    ],

    useWhen: [
      "Node order must be reversed by changing links."
    ],

    avoidWhen: [
      "The input structure does not support the required link changes."
    ],

    conditions: [
      "Preserve the next node before overwriting a link.",
      "Update the head after reversal.",
      "Handle empty and single-node lists."
    ],

    structures: ["Linked List"],

    strengths: [
      "Can use O(1) auxiliary space for iterative full-list reversal."
    ],

    limitations: [
      "Incorrect pointer-update order can disconnect part of the list."
    ],

    questionsToAsk: [
      "Where is the next node stored before changing the current link?",
      "What will the new head be?",
      "Which node points to null?"
    ]
  }

});

/**
 * Patterns in the registry without a detailed curated knowledge record.
 * These are deliberately not treated as rule-supported recommendations.
 */
export const PATTERN_KNOWLEDGE_GAPS = Object.freeze(
  PATTERNS.filter(
    pattern => !Object.hasOwn(PATTERN_KNOWLEDGE_BASE, pattern)
  )
);

export function getPatternKnowledge(patternName) {
  return PATTERN_KNOWLEDGE_BASE[patternName] || null;
}
