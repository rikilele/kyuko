// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/**
 * A handler that stores different route paths registered by Kyuko,
 * and offers methods to match url paths to those route paths.
 *
 * Note on handling slashes:
 *   - Recurring leading slashes will be merged and considered as one slash
 *   - Recurring slashes that appear mid-path will contribute to empty paths
 *   - A single trailing slash will be ignored
 *
 * For more details, see: https://datatracker.ietf.org/doc/html/rfc3986.
 */
export default class RoutePathHandler {
  #treeHeight = 0;
  #rootNode = RoutePathNode.createRoot();

  /**
   * Adds a route path to the handler.
   * Added route paths will be considered in subsequent calls to `findMatch()`.
   *
   * @param path A valid Kyuko route path such as "/", "/users", "/users/:id"
   */
  addRoutePath(routePath: string): void {
    const segments = this.splitPathSegments(routePath);
    this.#treeHeight = Math.max(segments.length, this.#treeHeight);
    let currNode = this.#rootNode;
    segments.forEach((segment) => {
      currNode = currNode.findOrCreateChild(segment);
    });

    currNode.isStationaryNode = true;
  }

  /**
   * Returns a route path that matches the input urlPath.
   * Returns undefined if no such path exists.
   * Prioritizes route paths that were added earlier.
   *
   * @param urlPath The path to match.
   * @returns matched path if exists. undefined if not.
   */
  findMatch(urlPath: string): string | undefined {
    const segments = this.splitPathSegments(urlPath);
    if (this.#treeHeight < segments.length) {
      return undefined;
    }

    let currNodes = [this.#rootNode];
    for (const segment of segments) {
      if (currNodes.length === 0) {
        return undefined;
      }

      const nextNodes: RoutePathNode[] = [];
      currNodes.forEach((node) => {
        nextNodes.push(...node.findMatchingChildren(segment));
      });

      currNodes = nextNodes;
    }

    const matchedNodes = currNodes.filter(node => node.isStationaryNode);
    if (matchedNodes.length === 0) {
      return undefined;
    }

    return matchedNodes[0].getFullPath();
  }

  /**
   * Splits the given path into an array of path segments.
   * Note that `splitPathSegments(path).join('/') !== path`.
   *
   * Examples:
   *   - `'/'`           => `['']`
   *   - `'//'`          => `['']`
   *   - `'/users'`      => `['', 'users']`
   *   - `'//users'`     => `['', 'users']`
   *   - `'/users/'`     => `['', 'users']`
   *   - `'/users/:id'`  => `['', 'users', ':id']`
   *   - `'/users//:id'` => `['', 'users', '', ':id']`
   *
   * @param path The route or url path to split
   */
  private splitPathSegments(path: string): string[] {
    const result = path.split('/');
    const divider = result.findIndex(seg => seg !== '');
    if (divider === -1) {
      return [''];
    }

    result.splice(0, divider - 1);
    if (result[result.length - 1] === '') {
      result.pop();
    }

    return result;
  }
}

/**
 * Represents a segment of a route path as a tree node.
 * For example, ["", "users", ":id"] are segments of the route path "/users/:id".
 * Each segment of the route path will be stored in a tree data structure as nodes.
 */
class RoutePathNode {

  /**
   * Whether the node can be considered the end of a path or not.
   */
  isStationaryNode: boolean;

  #value: string;
  #parent: RoutePathNode | null;
  #concreteChildren: Map<string, RoutePathNode>;
  #wildcardChildren: Map<string, RoutePathNode>;

  /**
   * @returns A new `RoutePathNode` that acts as the root of the tree.
   */
  static createRoot(): RoutePathNode {
    return new RoutePathNode('\0', null);
  }

  /**
   * Constructs a `RoutePathNode` object.
   * Private constructor to prevent clients from creating circular trees.
   * Use `RoutePathNode.createRoot()` to create root nodes.
   *
   * @param value The value of the segment of the route path. '\0' for root node.
   * @param parent The parent of the segment of the route path. null for root node.
   */
  private constructor(value: string, parent: RoutePathNode | null) {
    this.isStationaryNode = false;
    this.#value = value;
    this.#parent = parent;
    this.#concreteChildren = new Map();
    this.#wildcardChildren = new Map();
  }

  /**
   * Finds and returns a child node that contains the **exact** `value`.
   * If the child doesn't exist, adds a new child node and returns that.
   *
   * @param value The value of the child node to find or create.
   * @returns The child node with the corresponding `value` (could be newly-created).
   */
  findOrCreateChild(value: string): RoutePathNode {
    let container = this.#concreteChildren;
    if (value.startsWith(':')) {
      container = this.#wildcardChildren;
    }

    if (container.has(value)) {
      return container.get(value) as RoutePathNode;
    }

    const newNode = new RoutePathNode(value, this);
    container.set(value, newNode);
    return newNode;
  }

  /**
   * Finds and returns children that match the `value`, including wildcards.
   *
   * @param value The value of the child node to match.
   * @returns An array of children that matches the `value`, including wildcards
   */
  findMatchingChildren(value: string): RoutePathNode[] {
    const result: RoutePathNode[] = [];
    if (this.#concreteChildren.has(value)) {
      result.push(this.#concreteChildren.get(value) as RoutePathNode);
    }

    this.#wildcardChildren.forEach((child) => {
      result.push(child);
    });

    return result;
  }

  /**
   * Traverses through the parents of the node
   * and constructs the full route path that the node represents.
   *
   * @returns The full route path.
   */
  getFullPath(): string {
    /**
     * Time complexity: O(n)
     *
     * We don't use result.unshift() because
     *   - while loop: O(n)
     *   - Array.prototype.push(): O(1)
     *   - Array.prototype.unshift(): O(n)
     *   - Array.prototype.reverse(): O(n)
     */
    const result = [];
    let node = this as RoutePathNode;
    while (node.#parent !== null) {
      result.push(node.#value);
      node = node.#parent;
    }

    result.reverse();
    return result.join('/') || '/';
  }
}
