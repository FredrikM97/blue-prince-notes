import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

if (!Object.prototype.hasOwnProperty.call(URL, "createObjectURL")) {
  Object.defineProperty(URL, "createObjectURL", {
    value: vi.fn(() => "blob:mock"),
    configurable: true,
    writable: true,
  });
}

if (!Object.prototype.hasOwnProperty.call(URL, "revokeObjectURL")) {
  Object.defineProperty(URL, "revokeObjectURL", {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
}

if (!Object.prototype.hasOwnProperty.call(globalThis, "ResizeObserver")) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverMock,
    configurable: true,
    writable: true,
  });
}

if (!Object.prototype.hasOwnProperty.call(globalThis, "IntersectionObserver")) {
  class IntersectionObserverMock {
    root = null;
    rootMargin = "0px";
    thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: IntersectionObserverMock,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

  if (typeof window !== "undefined") {
    window.localStorage?.clear?.();
    window.sessionStorage?.clear?.();
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
