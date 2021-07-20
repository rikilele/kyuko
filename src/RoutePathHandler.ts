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
export class RoutePathHandler {
  #rootNode = RoutePathNode.createRoot();

  /**
   * Given that the `urlPath` matches the `routePath`,
   * compares the two strings and constructs an object that contains
   * the wildcards as its keys and the corresponding url path segments as its values.
   * The object an be used directly as `req.params`.
   *
   * @param routePath e.g.) "/users/:userId/friends/:friendId"
   * @param urlPath e.g.) "/users/Alice/friends/Bob"
   * @returns e.g.) { userId: "Alice", friendId: "Bob" }
   */
  static createPathParams(routePath: string, urlPath: string) {
    const result: { [key: string]: string } = {};
    const routeSegments = RoutePathHandler.splitPathSegments(routePath);
    const urlSegments = RoutePathHandler.splitPathSegments(urlPath);
    routeSegments.forEach((routeSegment, i) => {
      if (routeSegment.startsWith(":")) {
        result[routeSegment.substring(1)] = urlSegments[i];
      }
    });

    return result;
  }

  /**
   * Adds a route path to the handler.
   * Added route paths will be considered in subsequent calls to `findMatch()`.
   *
   * @param path A valid Kyuko route path such as "/", "/users", "/users/:id"
   */
  addRoutePath(routePath: string): void {
    const segments = RoutePathHandler.splitPathSegments(routePath);
    let currNode = this.#rootNode;
    segments.forEach((segment) => {
      currNode = currNode.findOrCreateChild(segment);
    });

    currNode.isStationaryNode = true;
  }

  /**
   * Returns a route path that matches the input urlPath.
   * Returns undefined if no such path exists.
   * Prioritizes route paths that have early exact matches rather than wildcards,
   * and route paths that were added earlier to the handler.
   *
   * @param urlPath The path to match.
   * @returns matched path if exists. undefined if not.
   */
  findMatch(urlPath: string): string | undefined {
    const segments = RoutePathHandler.splitPathSegments(urlPath);
    let currNodes: RoutePathNode[] = [this.#rootNode];
    segments.forEach((segment, i) => {
      if (currNodes.length === 0) {
        return undefined;
      }

      const nextNodes: RoutePathNode[] = [];
      currNodes.forEach((node) => {
        node.findMatchingChildren(segment).forEach((child) => {
          // Child should be taller than remaining path
          if (child.getHeight() >= segments.length - i - 1) {
            nextNodes.push(child);
          }
        });
      });

      currNodes = nextNodes;
    });

    const finalists = currNodes.filter((node) => node.isStationaryNode);
    if (finalists.length === 0) {
      return undefined;
    }

    return finalists[0].routePath;
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
  private static splitPathSegments(path: string): string[] {
    const result = path.split("/");
    const divider = result.findIndex((seg) => seg !== "");
    if (divider === -1) {
      return [""];
    }

    result.splice(0, divider - 1);
    if (result[result.length - 1] === "") {
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

  /**
   * The full route path that the node represents.
   * Dependent on the specific node's parent.
   */
  routePath: string;

  #value: string;
  #height: number;
  #parent: RoutePathNode | null;
  #concreteChildren: Map<string, RoutePathNode>;
  #wildcardChildren: Map<string, RoutePathNode>;

  /**
   * @returns A new `RoutePathNode` that acts as the root of the tree.
   */
  static createRoot(): RoutePathNode {
    return new RoutePathNode("\0", null);
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
    this.#height = 0;
    this.#parent = parent;
    this.#concreteChildren = new Map();
    this.#wildcardChildren = new Map();

    // Construct the routePath
    if (parent === null) {
      this.routePath = "";
    } else if (parent.#value === "\0") {
      this.routePath = "/";
    } else if (parent.routePath === "/") {
      this.routePath = `/${value}`;
    } else {
      this.routePath = `${parent.routePath}/${value}`;
    }
  }

  /**
   * @returns The height of the node (= # of nodes until furthest leaf)
   */
  getHeight(): number {
    return this.#height;
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
    if (value.startsWith(":")) {
      container = this.#wildcardChildren;
    }

    if (container.has(value)) {
      return container.get(value) as RoutePathNode;
    }

    const newNode = new RoutePathNode(value, this);
    container.set(value, newNode);
    newNode.updateTreeHeight();
    return newNode;
  }

  /*
   * To be called by `findOrCreateChild()`.
   * Assumes that `this` refers to a newly created child node.
   */
  private updateTreeHeight() {
    let currNode = this as RoutePathNode;
    while (currNode.#parent !== null) {
      const parentNode = currNode.#parent;

      // Parent has taller children
      if (parentNode.#height !== currNode.#height) {
        return;
      }

      parentNode.#height += 1;
      currNode = parentNode;
    }
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
}
