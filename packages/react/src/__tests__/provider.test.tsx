import { ApiClient, createClient } from "@api-zero/core";
import { act, render, renderHook } from "@testing-library/react";
import type React from "react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ApiProvider } from "../provider";
import { useApi } from "../use-api";

describe("ApiProvider & useApi", () => {
  it("should provide an ApiClient instance created from config", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider
        config={{ baseURL: "https://api.example.com", timeout: 5000 }}
      >
        {children}
      </ApiProvider>
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current).toBeInstanceOf(ApiClient);
    expect(result.current.getConfig().baseURL).toBe("https://api.example.com");
    expect(result.current.getConfig().timeout).toBe(5000);
  });

  it("should provide a directly supplied client instance", () => {
    const customClient = createClient({
      baseURL: "https://custom.api.org",
      headers: { "X-Custom": "123" },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider client={customClient}>{children}</ApiProvider>
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current).toBe(customClient);
    expect(result.current.getConfig().baseURL).toBe("https://custom.api.org");
    expect(result.current.getConfig().headers?.["X-Custom"]).toBe("123");
  });

  it("should throw a descriptive error when useApi is called outside ApiProvider", () => {
    // Suppress console.error during error boundary test
    const originalError = console.error;
    console.error = () => {};

    expect(() => renderHook(() => useApi())).toThrow(
      "useApi must be used within an ApiProvider",
    );

    console.error = originalError;
  });

  it("should maintain a stable client reference across re-renders with equivalent inline config", () => {
    let renderCount = 0;
    let hookClientA: ApiClient | undefined;
    let hookClientB: ApiClient | undefined;

    function TestComponent() {
      const [, setCounter] = useState(0);
      renderCount++;

      return (
        <ApiProvider config={{ baseURL: "https://api.test", timeout: 1000 }}>
          <ChildConsumer
            onRender={(client) => {
              if (renderCount === 1) hookClientA = client;
              if (renderCount === 2) hookClientB = client;
            }}
          />
          <button onClick={() => setCounter((c) => c + 1)}>Re-render</button>
        </ApiProvider>
      );
    }

    function ChildConsumer({
      onRender,
    }: {
      onRender: (client: ApiClient) => void;
    }) {
      const client = useApi();
      onRender(client);
      return <div>Consumer</div>;
    }

    const { getByText } = render(<TestComponent />);
    expect(renderCount).toBe(1);

    // Trigger parent re-render inside act
    act(() => {
      getByText("Re-render").click();
    });
    expect(renderCount).toBe(2);

    // Both renders must have the EXACT SAME client reference!
    expect(hookClientA).toBeDefined();
    expect(hookClientB).toBeDefined();
    expect(hookClientA).toBe(hookClientB);
  });
});
