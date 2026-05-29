import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLayout } from "../../src/components/common/PageLayout";

describe("PageLayout", () => {
  it("matches snapshot for three-column layout", () => {
    const { asFragment } = render(
      <PageLayout
        leftSidebar={<div>left</div>}
        middle={<div>middle</div>}
        rightSidebar={<div>right</div>}
      />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot for single-column middle-scroll mode", () => {
    const { asFragment } = render(
      <PageLayout prioritizeMiddleScroll middle={<div>settings-like-content</div>} />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("forwards wheel delta to middle content when prioritized", () => {
    const { container } = render(
      <PageLayout
        prioritizeMiddleScroll
        leftSidebar={<div>left</div>}
        middle={<div>middle</div>}
        rightSidebar={<div>right</div>}
      />,
    );

    const middle = container.querySelector("main") as HTMLElement;
    const sidebar = container.querySelector("aside") as HTMLElement;
    middle.scrollTop = 10;

    fireEvent.wheel(sidebar, { deltaY: 25 });
    expect(middle.scrollTop).toBe(35);
  });

  it("does not move middle scroll when wheel delta is zero", () => {
    const { container } = render(
      <PageLayout
        prioritizeMiddleScroll
        leftSidebar={<div>left</div>}
        middle={<div>middle</div>}
      />,
    );

    const middle = container.querySelector("main") as HTMLElement;
    const sidebar = container.querySelector("aside") as HTMLElement;
    middle.scrollTop = 40;

    fireEvent.wheel(sidebar, { deltaY: 0 });
    expect(middle.scrollTop).toBe(40);
  });

  it("does not forward wheel when prioritize mode is off", () => {
    const { container } = render(
      <PageLayout leftSidebar={<div>left</div>} middle={<div>middle</div>} />,
    );

    const middle = container.querySelector("main") as HTMLElement;
    const sidebar = container.querySelector("aside") as HTMLElement;
    middle.scrollTop = 5;

    fireEvent.wheel(sidebar, { deltaY: 20 });
    expect(middle.scrollTop).toBe(5);
  });
});
