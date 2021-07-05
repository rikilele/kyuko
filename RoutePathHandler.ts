// Copyright 2021 Riki Singh Khorana. All rights reserved. MIT license.

/**
 * A handler that stores different route paths registered by Kyuko,
 * and offers methods to match url paths to those route paths.
 */
export default class RoutePathHandler {

  // dummy root node for route path tree
  #rootNode = new RoutePathNode('\0', null);

  /**
   * Adds a route path to the handler.
   * Added route paths will be considered in subsequent calls to `findMatch()`.
   *
   * @param path A valid Kyuko route path such as "/", "/users", "/users/:id"
   */
  addRoutePath(routePath: string) {
    const strings = routePath.split('/');

    // Add the nodes of the route path to the tree
    let currNode = this.#rootNode;
    strings.forEach((str) => {
      const newNode = new RoutePathNode(str, currNode);

      // If wildcard
      if (str.startsWith(':')) {
        if (!currNode.wildcardChildren.has(str)) {
          currNode.wildcardChildren.set(str, newNode);
        }

        currNode = currNode.wildcardChildren.get(str) as RoutePathNode;

      // Not wildcard
      } else {
        if (!currNode.concreteChildren.has(str)) {
          currNode.concreteChildren.set(str, newNode);
        }

        currNode = currNode.concreteChildren.get(str) as RoutePathNode;
      }
    });

    currNode.isStationaryNode = true;
  }

  /**
   * Returns a route path that matches the input urlPath.
   * Returns undefined if no such path exists.
   *
   * @param urlPath The path to match.
   * @returns matched path if exists. undefined if not.
   */
  findMatch(urlPath: string) {
    const strings = urlPath.split('/');

    // Trailing slashes will be ignored, except for the root path ("/")
    if (urlPath.length > 2 && urlPath.endsWith('/')) {
      strings.pop();
    }

    let currNodes = [this.#rootNode];
    for (const str of strings) {
      if (currNodes.length === 0) {
        return undefined;
      }

      const nextNodes: RoutePathNode[] = [];
      currNodes.forEach((currNode) => {
        if (currNode.concreteChildren.has(str)) {
          nextNodes.push(currNode.concreteChildren.get(str) as RoutePathNode);
        }

        currNode.wildcardChildren.forEach((wildcardNode) => {
          nextNodes.push(wildcardNode);
        });
      });

      currNodes = nextNodes;
    }

    // Prioritize route paths that were added first
    const matchedNode = currNodes.filter(node => node.isStationaryNode)[0];
    if (matchedNode === undefined) {
      return undefined;
    }

    return RoutePathNode.getFullPath(matchedNode);
  }
}

/**
 * Represents a "node" of a route path.
 * For example, ["", "users", ":id"] are nodes of the route path "/users/:id".
 */
class RoutePathNode {

  // The string value of the node
  value: string;

  // The parent of the node
  parent: RoutePathNode | null;

  // Whether the node can be considered the end of a path
  isStationaryNode: boolean;

  // Direct children of the node, where their values are not wildcard values
  concreteChildren: Map<string, RoutePathNode>;

  // Direct children of the node, where their values are wildcard values
  wildcardChildren: Map<string, RoutePathNode>;

  constructor(value: string, parent: RoutePathNode | null) {
    this.value = value;
    this.parent = parent;
    this.isStationaryNode = false;
    this.concreteChildren = new Map();
    this.wildcardChildren = new Map();
  }

  /**
   * Traverses through the parents of the node and constructs the full path
   * that the node represents.
   *
   * @param node The final node of the path.
   * @returns The full path
   */
  static getFullPath(node: RoutePathNode) {
    const result = [];
    let currNode = node;
    while (currNode.parent !== null) {
      result.unshift(currNode.value);
      currNode = currNode.parent;
    }

    return result.join('/');
  }
}
