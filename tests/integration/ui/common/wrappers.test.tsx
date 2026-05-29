import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Toaster } from "@/components/common/Sonner";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/common/dropdown/DropdownMenu";

const sonnerSpy = vi.fn<(props: unknown) => ReactElement>((_props) => <div data-testid="sonner" />);

vi.mock("sonner", () => ({
  Toaster: (props: unknown) => {
    sonnerSpy(props);
    return <div data-testid="sonner" />;
  },
}));

vi.mock("@radix-ui/react-dropdown-menu", () => {
  const Primitive = {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Trigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
    Sub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Content: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="content" className={className}>
        {children}
      </div>
    ),
    SubTrigger: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <button data-testid="sub-trigger" className={className} {...props}>
        {children}
      </button>
    ),
    SubContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="sub-content" className={className}>
        {children}
      </div>
    ),
    Item: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <button data-testid="item" className={className}>
        {children}
      </button>
    ),
    Separator: ({ className }: { className?: string }) => (
      <hr data-testid="separator" className={className} />
    ),
  };

  return Primitive;
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
  });

  it("initializes from localStorage dark theme and toggles to light", () => {
    localStorage.setItem("bp-theme", "dark");
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /Switch to light theme/i });
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /Switch to dark theme/i })).toBeInTheDocument();
    expect(localStorage.getItem("bp-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("falls back to matchMedia preference", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: /Switch to light theme/i })).toBeInTheDocument();
  });
});

describe("Toaster wrapper", () => {
  beforeEach(() => {
    sonnerSpy.mockClear();
  });

  it("passes className and toastOptions class map to sonner", () => {
    render(<Toaster richColors />);

    expect(screen.getByTestId("sonner")).toBeInTheDocument();
    expect(sonnerSpy).toHaveBeenCalledTimes(1);

    const props = sonnerSpy.mock.calls[0][0] as {
      className?: string;
      toastOptions?: { classNames?: Record<string, string> };
      richColors?: boolean;
    };
    expect(props.className).toBe("toaster group");
    expect(props.toastOptions?.classNames?.toast).toContain("group-[.toaster]:bg-background");
    expect(props.richColors).toBe(true);
  });
});

describe("DropdownMenu wrappers", () => {
  it("renders content/item/separator classes", () => {
    render(
      <div>
        <DropdownMenuContent className="extra-content">Body</DropdownMenuContent>
        <DropdownMenuItem className="extra-item">Item</DropdownMenuItem>
        <DropdownMenuSeparator className="extra-sep" />
      </div>,
    );

    expect(screen.getByTestId("content").className).toContain("extra-content");
    expect(screen.getByTestId("item").className).toContain("extra-item");
    expect(screen.getByTestId("separator").className).toContain("extra-sep");
  });

  it("renders sub trigger arrow and inset classes", () => {
    render(
      <div>
        <DropdownMenuSubTrigger inset className="extra-sub-trigger">
          Sub item
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="extra-sub-content">Sub content</DropdownMenuSubContent>
      </div>,
    );

    expect(screen.getByTestId("sub-trigger").className).toContain("pl-8");
    expect(screen.getByTestId("sub-trigger").className).toContain("extra-sub-trigger");
    expect(screen.getByTestId("sub-content").className).toContain("extra-sub-content");
  });
});
